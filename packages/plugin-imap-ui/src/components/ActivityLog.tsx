import {
  AcitivityHeader,
  ActivityDate,
  ActivityIcon,
  ActivityRow,
  IMapActivityContent,
  SentWho
} from '../styles';

import Button from '@erxes/ui/src/components/Button';
import Icon from '@erxes/ui/src/components/Icon';
import React from 'react';
import Tip from '@erxes/ui/src/components/Tip';
import { __ } from '@erxes/ui/src/utils/core';
import dayjs from 'dayjs';
import { getIconAndColor } from '@erxes/ui-log/src/activityLogs/utils';
import { Link } from 'react-router-dom';


import {
 
  CenterText,
  Collapse,
  CollapseTrigger,
  ConversationContent,
  Count,
  FlexBody,
  FlexCenterContent,
  Header
} from '@erxes/ui-log/src/activityLogs/styles';
type Props = {
  contentType: string;
  activity: any;
  currentUser: any;
};

type State = {
  shrink: boolean;
};

class ActivityItem extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    const { contentTypeDetail = {} } = props.activity;

    this.state = {
      shrink: (contentTypeDetail.body || '').length > 380 ? true : false
    };
  }

  renderWhom(contentTypeDetail) {
    const { from, to } = contentTypeDetail;
    const From = from ? from.map(f => f.name || f.address) : 'unknown';
    const To = to ? to.map(f => f.name || f.address) : 'unknown';

     
    return (
      <SentWho>
        <strong>{From.map(f => f)}</strong>
        {__('send email to ')}
        <strong>{To.map(t => t)}</strong>

        
      </SentWho>
    );
  }

  renderExpandButton(contentTypeDetail) {
    const { inboxConversationId } = contentTypeDetail;
    const { shrink } = this.state;

    if (!shrink) {
    {shrink ? __('Shrink email') : __('Expand email')}
    }
    
    return (

        <>
      <Button
        size="small"
        btnStyle="warning"
        onClick={() => this.setState({ shrink: !shrink })}
      >
        {shrink ? __('Expand email') : __('Shrink email')}

      </Button>


        

        <CenterText>
          <Link to={`/inbox/index?_id=${inboxConversationId}`}>
            {__('See full mail')} <Icon icon="angle-double-right" />
          </Link>
        </CenterText>
        </>
    );
  }
  

  render() {
    const { activity } = this.props;
    const { contentTypeDetail, contentType } = activity;
    const { body, subject, createdAt } = contentTypeDetail;

    if (contentType && !contentType.includes('imap')) {
      return null;
    }

    const iconAndColor = getIconAndColor('email');

    return (
      <ActivityRow>
        <Tip text={'imap email'} placement="top">
          <ActivityIcon color={iconAndColor.color}>
            <Icon icon={iconAndColor.icon} />
          </ActivityIcon>
        </Tip>

        <AcitivityHeader>
          <strong>{subject}</strong>
          <ActivityDate>{dayjs(createdAt).format('lll')}</ActivityDate>
        </AcitivityHeader>
        {this.renderWhom(contentTypeDetail)}

        <IMapActivityContent shrink={this.state.shrink}>
          <div dangerouslySetInnerHTML={{ __html: body }} />
          {this.renderExpandButton(contentTypeDetail)}
        </IMapActivityContent>
      </ActivityRow>
    );
  }
}

export default ActivityItem;
