import dayjs from "dayjs";
import Icon from "@erxes/ui/src/components/Icon";
import React from "react";
import Popover from "@erxes/ui/src/components/Popover";
import Datetime from "@nateradebaugh/react-datetime";
import { __ } from "@erxes/ui/src/utils/core";

type Props = {
  config: any;
  triggerType: string;
  setConfig: (config: any) => void;
  inputName?: string;
};

export default class SelectDate extends React.Component<Props> {
  private overlay: any;

  onOverlayClose = () => {
    this.overlay.hide();
  };

  render() {
    const { config, setConfig, inputName = "value" } = this.props;

    const onDateChange = (date) => {
      config[inputName] = `${dayjs(date).format("YYYY-MM-DD, HH:mm:ss")}`;
      setConfig(config);
    };

    return (
      <Popover
        ref={this.overlay}
        trigger={
          <span>
            {__("Date")} <Icon icon="angle-down" />
          </span>
        }
        placement="top"
      >
        <Datetime
          inputProps={{ placeholder: "Click to select a date" }}
          dateFormat="YYYY/MM/DD"
          timeFormat="HH:mm"
          closeOnSelect={true}
          utc={true}
          input={false}
          value={config[inputName] || ""}
          onChange={onDateChange}
          defaultValue={dayjs()
            .startOf("day")
            .add(12, "hour")
            .format("YYYY-MM-DD HH:mm:ss")}
        />
      </Popover>
    );
  }
}
