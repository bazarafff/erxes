import { IModels } from '../connectionResolver';
import { getActionsMap } from '../helpers';
import { IAction } from '../models/definitions/automaions';
import {
  EXECUTION_STATUS,
  IExecAction,
  IExecutionDocument,
} from '../models/definitions/executions';
import { executeActions } from '../utils';

function accessNestedObject(obj, keys) {
  return keys.reduce((acc, key) => acc && acc[key], obj) || '';
}

export const playWait = async (models: IModels, subdomain: string, data) => {
  const waitingExecutions = await models.Executions.find({
    waitingActionId: { $ne: null },
    startWaitingDate: { $ne: null },
  });

  for (const exec of waitingExecutions) {
    const automation = await models.Automations.findOne({
      _id: exec.automationId,
    }).lean();

    if (!automation) {
      continue;
    }

    const currentAction: IAction | undefined = automation.actions.find(
      (a) => a.id === exec.waitingActionId,
    );

    if (!currentAction) {
      // waiting action is deleted or changed type from interface
      exec.waitingActionId = undefined;
      exec.startWaitingDate = undefined;
      exec.status = EXECUTION_STATUS.MISSID;
      exec.save();
      continue;
    }

    if (!exec.startWaitingDate) {
      continue;
    }

    if (
      currentAction.type === 'delay' &&
      (!currentAction.config || !currentAction.config.value)
    ) {
      continue;
    }

    let performDate = new Date(exec.startWaitingDate);
    let nextActionId = exec.waitingActionId;

    if (currentAction.type === 'delay') {
      const finalWaitHour =
        currentAction.config.type === 'hour'
          ? currentAction.config.value
          : currentAction.config.value * 24;
      performDate = new Date(
        exec.startWaitingDate.getTime() + (finalWaitHour || 0) * 60 * 60 * 1000,
      );
      nextActionId = currentAction.nextActionId;
    }

    if (performDate > new Date()) {
      continue;
    }

    exec.waitingActionId = undefined;
    exec.startWaitingDate = undefined;
    exec.save();
    await executeActions(
      subdomain,
      exec.triggerType,
      exec,
      await getActionsMap(automation.actions || []),
      nextActionId,
    );
  }
};

export const doWaitingResponseAction = async (
  models: IModels,
  subdomain: string,
  data,
) => {
  const { type, targets } = data;

  const waitingExecutions = await models.Executions.find({
    triggerType: type,
    status: EXECUTION_STATUS.WAITING,
    $and: [
      { objToCheck: { $exists: true } },
      { objToCheck: { $ne: null } },
      { responseActionId: { $exists: true } },
      { responseActionId: { $ne: null } },
    ],
  });

  const clearExecution = (exec: IExecutionDocument, status?: string) => {
    exec.responseActionId = undefined;
    exec.startWaitingDate = undefined;
    exec.objToCheck = undefined;

    if (status) {
      exec.status = status;
    }

    exec.save();
  };

  for (const exec of waitingExecutions) {
    const automation = await models.Automations.findOne({
      _id: exec.automationId,
    }).lean();

    if (!automation) {
      continue;
    }

    const currentAction = automation.actions.find(
      (action) => action.id === exec.responseActionId,
    );

    if (!currentAction) {
      clearExecution(exec, EXECUTION_STATUS.MISSID);
      exec.save();
      continue;
    }

    const { config } = currentAction;

    if (!config?.optionalConnects?.length) {
      clearExecution(exec);
      continue;
    }

    const optionalConnects = config.optionalConnects;
    const { objToCheck } = exec;
    const { propertyName } = objToCheck;

    for (const target of targets) {
      //check every general properties in the target
      const propertyValue = accessNestedObject(target, propertyName.split('.'));
      const optionalConnection = optionalConnects.find(
        ({ optionalConnectId }) => optionalConnectId === String(propertyValue),
      );

      if (!optionalConnection) {
        continue;
      }

      exec.responseActionId = undefined;
      exec.startWaitingDate = undefined;
      exec.objToCheck = undefined;

      return await executeActions(
        subdomain,
        exec.triggerType,
        exec,
        await getActionsMap(automation.actions || []),
        optionalConnection.actionId,
      );
    }
  }

  return 'success';
};

export const setActionWait = async (data) => {
  const {
    objToCheck,
    startWaitingDate,
    waitingActionId,
    execution,
    action,
    result,
  } = data;

  const execAction: IExecAction = {
    actionId: action.id,
    actionType: action.type,
    actionConfig: action.config,
    nextActionId: action.nextActionId,
    result,
  };

  execution.waitingActionId = waitingActionId;
  execution.responseActionId = action.id;

  execution.startWaitingDate = startWaitingDate;

  execution.actions = [...(execution.actions || []), execAction];
  execution.objToCheck = objToCheck;
  execution.status = EXECUTION_STATUS.WAITING;
  await execution.save();

  return 'paused';
};

export const checkWaitingResponseAction = async (
  models: IModels,
  type: string,
  actionType: string,
  targets: any[],
) => {
  if (actionType) {
    false;
  }

  const waitingResponseExecution = await models.Executions.find({
    triggerType: type,
    status: EXECUTION_STATUS.WAITING,
    $and: [
      { objToCheck: { $exists: true } },
      { objToCheck: { $ne: null }, responseActionId: { $exists: true } },
    ],
  });

  for (const { objToCheck, actions = [] } of waitingResponseExecution) {
    const { general, propertyName } = objToCheck;

    const generalKeys = Object.keys(general);
    for (const target of targets) {
      const valueToCheck = accessNestedObject(target, propertyName.split('.'));

      if (generalKeys.every((key) => target[key] === general[key])) {
        for (const { actionConfig } of actions) {
          if (
            (actionConfig?.optionalConnects || []).some(
              ({ optionalConnectId }) => optionalConnectId == valueToCheck,
            )
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
};
