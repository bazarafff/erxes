import { router, __ } from '@erxes/ui/src/utils';
import Sidebar from '@erxes/ui/src/layout/components/Sidebar';
import React, { useState } from 'react';
import SelectTeamMembers from '@erxes/ui/src/team/containers/SelectTeamMembers';
import {
  FlexColumnCustom,
  FlexRow,
  SidebarActions,
  SidebarHeader
} from '../../styles';
import { CustomRangeContainer } from '../../styles';
import DateControl from '@erxes/ui/src/components/form/DateControl';
import Button from '@erxes/ui/src/components/Button';
import Select from 'react-select-plus';
import ControlLabel from '@erxes/ui/src/components/form/Label';
import { IBranch, IDepartment } from '@erxes/ui/src/team/types';
import { IUser } from '@erxes/ui/src/auth/types';
import { prepareCurrentUserOption } from '../../utils';

type Props = {
  currentUser: IUser;
  isCurrentUserAdmin: boolean;

  queryParams: any;
  history: any;
  branches: IBranch[];
  departments: IDepartment[];
};

const NOW = new Date();
// get 1st of the next Month
const startOfNextMonth = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 1);
// get 1st of this month
const startOfThisMonth = new Date(NOW.getFullYear(), NOW.getMonth(), 1);

const LeftSideBar = (props: Props) => {
  const {
    history,
    branches,
    queryParams,
    departments,
    currentUser,
    isCurrentUserAdmin
  } = props;

  const [currUserIds, setUserIds] = useState(queryParams.userIds);

  const [selectedBranches, setBranches] = useState(queryParams.branchIds);
  const [selectedDepartments, setDepartments] = useState(
    queryParams.departmentIds
  );

  const returnTotalUserOptions = () => {
    const totalUserOptions: string[] = [];

    for (const dept of departments) {
      totalUserOptions.push(...dept.userIds);
    }

    for (const branch of branches) {
      totalUserOptions.push(...branch.userIds);
    }

    totalUserOptions.push(currentUser._id);

    return totalUserOptions;
  };

  const filterParams = isCurrentUserAdmin
    ? {}
    : {
        ids: returnTotalUserOptions(),
        excludeIds: false
      };

  const [startDate, setStartDate] = useState(
    queryParams.startDate || startOfThisMonth
  );
  const [endDate, setEndDate] = useState(
    queryParams.endDate || startOfNextMonth
  );

  const cleanFilter = () => {
    onBranchSelect([]);
    onDepartmentSelect([]);
    onMemberSelect([]);
    onStartDateChange(startOfThisMonth);
    onEndDateChange(startOfNextMonth);
    router.removeParams(
      history,
      'userIds',
      'branchIds',
      'startDate',
      'endDate',
      'departmentIds'
    );
    removePageParams();
  };

  const removePageParams = () => {
    router.removeParams(history, 'page', 'perPage');
  };

  const setParams = (key: string, value: any) => {
    if (value) {
      router.setParams(history, {
        [key]: value
      });

      removePageParams();
    }
  };

  if (!queryParams.startDate) {
    setParams('startDate', startOfThisMonth);
  }
  if (!queryParams.endDate) {
    setParams('endDate', startOfNextMonth);
  }

  const renderDepartmentOptions = (depts: IDepartment[]) => {
    return depts.map(dept => ({
      value: dept._id,
      label: dept.title,
      userIds: dept.userIds
    }));
  };

  const renderBranchOptions = (branchesList: IBranch[]) => {
    return branchesList.map(branch => ({
      value: branch._id,
      label: branch.title,
      userIds: branch.userIds
    }));
  };

  const onBranchSelect = selectedBranch => {
    setBranches(selectedBranch);

    const selectedBranchIds: string[] = [];

    selectedBranch.map(branch => {
      selectedBranchIds.push(branch.value);
    });

    setParams('branchIds', selectedBranchIds);
  };

  const onDepartmentSelect = selectedDepartment => {
    setDepartments(selectedDepartment);

    const selectedDepartmentIds: string[] = [];

    selectedDepartment.map(department => {
      selectedDepartmentIds.push(department.value);
    });

    setParams('departmentIds', selectedDepartmentIds);
  };

  const onMemberSelect = selectedUsers => {
    setUserIds(selectedUsers);

    setParams('userIds', selectedUsers);
  };

  const onStartDateChange = date => {
    setStartDate(date);
    setParams('startDate', date);
  };

  const onEndDateChange = date => {
    setEndDate(date);

    setParams('endDate', date);
  };

  const renderSidebarActions = () => {
    return (
      <SidebarHeader>
        <CustomRangeContainer>
          <DateControl
            required={false}
            value={startDate}
            name="startDate"
            placeholder={'Starting date'}
            dateFormat={'YYYY-MM-DD'}
            onChange={onStartDateChange}
          />
          <DateControl
            required={false}
            value={endDate}
            name="endDate"
            placeholder={'Ending date'}
            dateFormat={'YYYY-MM-DD'}
            onChange={onEndDateChange}
          />
        </CustomRangeContainer>
      </SidebarHeader>
    );
  };

  const renderSidebarHeader = () => {
    return <SidebarActions>{renderSidebarActions()}</SidebarActions>;
  };

  const onDateButtonClick = (type: string) => {
    const startOfLastMonth = new Date(NOW.getFullYear(), NOW.getMonth() - 1, 1);

    if (type === 'today') {
      setStartDate(NOW);
      setEndDate(NOW);
      setParams('startDate', NOW);
      setParams('endDate', NOW);
    }

    if (type === 'last month') {
      const endOfLastMonth = new Date(NOW);

      setStartDate(startOfLastMonth);
      setParams('startDate', startOfLastMonth);

      // set 1st of current month
      endOfLastMonth.setDate(1);
      // Subtract 1 day to go back to the last day of the previous month
      endOfLastMonth.setDate(endOfLastMonth.getDate() - 1);

      setEndDate(endOfLastMonth);
      setParams('endDate', endOfLastMonth);
    }

    if (type === 'last week') {
      const startOfLastWeek = new Date(NOW);
      const endOfLastWeek = new Date(NOW);

      // Set the date to the beginning of the current week (Sunday)
      startOfLastWeek.setDate(NOW.getDate() - NOW.getDay());

      // Subtract 7 days to get to the start of the last week
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 6);

      // Set the date to the end of the week (Sunday)
      endOfLastWeek.setDate(NOW.getDate() - NOW.getDay() + 7);

      // Subtract 7 days to get to the end of the last week
      endOfLastWeek.setDate(endOfLastWeek.getDate() - 7);

      setStartDate(startOfLastWeek);
      setParams('startDate', startOfLastWeek);

      setEndDate(endOfLastWeek);
      setParams('endDate', endOfLastWeek);
    }
  };

  return (
    <Sidebar wide={true} hasBorder={true} header={renderSidebarHeader()}>
      <FlexColumnCustom marginNum={20}>
        <FlexRow>
          <Button
            style={{ width: '30%' }}
            size="small"
            btnStyle="primary"
            onClick={() => onDateButtonClick('today')}
          >
            Today
          </Button>
          <Button
            style={{ width: '30%' }}
            size="small"
            btnStyle="primary"
            onClick={() => onDateButtonClick('last week')}
          >
            Last week
          </Button>
          <Button
            style={{ width: '30%' }}
            size="small"
            btnStyle="primary"
            onClick={() => onDateButtonClick('last month')}
          >
            Last month
          </Button>
        </FlexRow>
        <div>
          <ControlLabel>Departments</ControlLabel>
          <Select
            value={selectedDepartments}
            onChange={onDepartmentSelect}
            placeholder="Select departments"
            multi={true}
            options={departments && renderDepartmentOptions(departments)}
          />
        </div>
        <div>
          <ControlLabel>Branches</ControlLabel>
          <Select
            value={selectedBranches}
            onChange={onBranchSelect}
            placeholder="Select branches"
            multi={true}
            options={branches && renderBranchOptions(branches)}
          />
        </div>
        <div>
          <ControlLabel>Team members</ControlLabel>
          <SelectTeamMembers
            initialValue={currUserIds}
            customField="employeeId"
            label="Select team member"
            name="userIds"
            customOption={prepareCurrentUserOption(currentUser)}
            filterParams={filterParams}
            queryParams={queryParams}
            onSelect={onMemberSelect}
          />
        </div>

        <Button btnStyle="warning" onClick={cleanFilter}>
          Clear filter
        </Button>
      </FlexColumnCustom>
    </Sidebar>
  );
};

export default LeftSideBar;
