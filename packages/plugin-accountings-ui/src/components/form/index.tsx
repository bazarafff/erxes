import { IButtonMutateProps, IQueryParams } from '@erxes/ui/src/types';
import ButtonMutate from '@erxes/ui/src/components/ButtonMutate';
import { IFieldsVisibility } from '@erxes/ui-contacts/src/customers/types';
import React from 'react';
import GenerateForm, { IField } from './GenerateForm';



interface IProps {
  fields: IField[] | [IField[]];
  mutation: string;
  type?: string;
  closeModal: () => void;
  queryParams: IQueryParams;
  customerVisibilityInDetail: IFieldsVisibility;
  refetchQueries:string[],
  successMessage:string
}

const CustomForm = (props: IProps) => {

  const renderButton = ({
    values,
    isSubmitted,
    resetSubmit
  }: IButtonMutateProps) => {
    const afterSave = () => {
      props.closeModal();
    };


    return (
      <ButtonMutate
        mutation={props.mutation}
        variables={values}
        callback={afterSave}
        refetchQueries={props.refetchQueries}
        isSubmitted={isSubmitted}
        disabled={isSubmitted}
        type="submit"
        icon="check-circle"
        resetSubmit={resetSubmit}
        successMessage={props.successMessage}
      />
    );
  };

  const updatedProps = {
    ...props,
    renderButton
  };

  return (
    <GenerateForm {...updatedProps} />
  );
};

export default CustomForm;
