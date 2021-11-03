import React from "react";
import Uploader from "erxes-ui/lib/components/Uploader";
import CodeBlock from "@theme/CodeBlock";
import { renderApiTable, stringify } from "../common.js";
import styles from "../../../src/components/styles.module.css";

export function UploaderComponent(props) {
const { singl, multi, lmt, type, table=[] } = props;
  
const propDatas = () => {
  const datas = {
    single : singl,
    multiple: multi,
    limit: lmt,
  };

    return datas;
  };

const renderBlock = () => {
  return(
    <>
    <Uploader {...propDatas()} />
    <CodeBlock className="language-jsx">
          {`<>\n\t<Uploader ${stringify(
            propDatas()
          )} />\n</>`}
        </CodeBlock>
      </>
    );
  };

  if (type === "APIuploader") {
    return renderApiTable("Uploader", table);
  }

return renderBlock();
}
