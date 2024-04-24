import Box from '@erxes/ui/src/components/Box';
import React from 'react';
import { __ } from '@erxes/ui/src';
import ModalTrigger from '@erxes/ui/src/components/ModalTrigger';
import { ButtonRelated } from '@erxes/ui/src/styles/main';
import ScoringForm from '../../containers/ScoringForm';
import EmptyState from '@erxes/ui/src/components/EmptyState';
type Props = {
  collapseCallback?: () => void;
  title?: string;
  
  mainType?: string;
  mainTypeId?: string;
};

function Component(
  this: any,
  {
    collapseCallback,
    title,
    mainTypeId = '',
  }: Props
) {
  
  const trigger = (
    <ButtonRelated>
      <span>{__('See related scoring..')}</span>
    </ButtonRelated>
  );

  const modalContent = props => {
    return <ScoringForm {...props} customerId={mainTypeId}  />;
  };
  const scoringButton = (
    <ModalTrigger
      size="lg"
      title="Customer Scoring"
      trigger={trigger}
      content={modalContent}
    />
  );
  const content = (
    <>
    <EmptyState icon="building" text="No scoring" />
     {scoringButton}

    </>
  );

  return (
    <Box
      title={__(`${title || 'Loan scoring'}`)}
      name="showBurenScoring"
      isOpen={true}
      callback={collapseCallback}
    >
      {content}
    </Box>
  );
}

export default Component
