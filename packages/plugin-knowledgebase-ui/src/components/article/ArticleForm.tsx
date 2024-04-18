import { FlexContent, FlexItem } from "@erxes/ui/src/layout/styles";
import { FlexRow, Forms, ReactionItem } from "./styles";
import {
  IArticle,
  IErxesForm,
  ITopic,
} from "@erxes/ui-knowledgebase/src/types";
import {
  IAttachment,
  IButtonMutateProps,
  IFormProps,
  IOption,
} from "@erxes/ui/src/types";
import React, { useEffect, useState } from "react";
import { __, extractAttachment } from "@erxes/ui/src/utils";

import Button from "@erxes/ui/src/components/Button";
import ControlLabel from "@erxes/ui/src/components/form/Label";
import { FILE_MIME_TYPES } from "@erxes/ui-settings/src/general/constants";
import Form from "@erxes/ui/src/components/form/Form";
import FormControl from "@erxes/ui/src/components/form/Control";
import FormGroup from "@erxes/ui/src/components/form/Group";
import Icon from "@erxes/ui/src/components/Icon";
import { ModalFooter } from "@erxes/ui/src/styles/main";
import { RichTextEditor } from "@erxes/ui/src/components/richTextEditor/TEditor";
import Select, { OnChangeValue, components } from "react-select";
import Uploader from "@erxes/ui/src/components/Uploader";
import { articleReactions } from "../../icons.constant";

type Props = {
  article: IArticle;
  currentCategoryId: string;
  renderButton: (props: IButtonMutateProps) => JSX.Element;
  closeModal: () => void;
  topics: ITopic[];
  topicId?: string;
};

const ArticleForm = (props: Props) => {
  const {
    article,
    topics,
    topicId: currentTopicId,
    currentCategoryId,
    renderButton,
    closeModal,
  } = props;

  const articleD = article || ({ content: "" } as IArticle);
  const attachmentsD =
    (article && article.attachments && extractAttachment(article.attachments)) || [];
  const imageD = article && article.image ? extractAttachment([article.image])[0] : null;

  const [content, setContent] = useState<string>(articleD.content);
  const [reactionChoices, setReactionChoices] = useState<string[]>(
    articleD.reactionChoices || []
  );
  const [status, setStatus] = useState<string>("draft");
  const [topicId, setTopicId] = useState<string | undefined>(articleD.topicId);
  const [categoryId, setCategoryId] = useState<string>(articleD.categoryId);
  const [attachments, setAttachments] = useState<IAttachment[]>(attachmentsD);
  const [image, setImage] = useState<IAttachment | null>(imageD);
  const [erxesForms, setErxesForms] = useState<IErxesForm[]>([]);
  const [isPrivate, setIsPrivate] = useState<boolean>(
    articleD.isPrivate || false
  );

  useEffect(() => {
    if (!topicId && topics && topics.length > 0) {
      setTopicId(props.topicId);
      setCategoryId(props.currentCategoryId);
    }
  }, [topicId, topics.length]);

  useEffect(() => {
    if (article) {
      const currentArticle = article || ({ content: "" } as IArticle);
      const attachments =
        (currentArticle.attachments &&
          extractAttachment(currentArticle.attachments)) ||
        [];
      const image = currentArticle.image
        ? extractAttachment([currentArticle.image])[0]
        : null;

      setContent(article.content);
      setReactionChoices(article.reactionChoices || []);
      setStatus(article.status);
      setTopicId(article.topicId);
      setCategoryId(article.categoryId);
      setErxesForms(article.forms || []);
      setAttachments(attachments);
      setImage(image);
    }
  }, [article]);

  const getFirstAttachment = () => {
    return attachments.length > 0 ? attachments[0] : ({} as IAttachment);
  };

  const generateDoc = (values: {
    _id?: string;
    title: string;
    summary: string;
    status: string;
    code?: string;
  }) => {
    const finalValues = values;

    if (article) {
      finalValues._id = article._id;
    }

    return {
      _id: finalValues._id,
      doc: {
        title: finalValues.title,
        code: finalValues.code,
        summary: finalValues.summary,
        content,
        reactionChoices,
        status: finalValues.status,
        isPrivate,
        categoryIds: [currentCategoryId],
        topicId,
        forms: erxesForms.map((f) => ({
          formId: f.formId,
          brandId: f.brandId,
        })),
        attachments,
        categoryId,
        image,
      },
    };
  };

  const handleContentChange = (e) => {
    setContent(e);
  };

  const handleReactionsChange = (options: OnChangeValue<IOption, true>) => {
    setReactionChoices(options.map((option) => option.value));
  };

  const handleStatusChange = (option: OnChangeValue<IOption, false>) => {
    setStatus(option?.value || "");
  };

  const handleAttachmentsChange = (attachments: IAttachment[]) =>
    setAttachments(attachments);

  const handleImageChange = (images: IAttachment[]) => {
    if (images && images.length > 0) {
      setImage(images[0]);
    } else {
      setImage(null);
    }
  };

  const handleAttachmentChange = (key: string, value: string | number) => {
    setAttachments([
      {
        ...getFirstAttachment(),
        [key]: value,
      },
    ]);
  };

  const onChangeIsCheckDate = (e) => {
    const isChecked = (e.currentTarget as HTMLInputElement).checked;
    setIsPrivate(isChecked);
  };

  const renderOption = (option) => {
    return (
      <ReactionItem>
        <img src={option.value} alt={option.label} />
        {option.label}
      </ReactionItem>
    );
  };

  const Option = (props) => {
    return (
      <components.Option {...props}>
        {renderOption(props.data)}
      </components.Option>
    );
  };

  const MultiValue = (props) => (
    <components.MultiValue {...props}>
      {renderOption(props.data)}
    </components.MultiValue>
  );

  const generateOptions = (options) => {
    return options.map((option) => ({
      value: option._id,
      label: option.title,
    }));
  };

  const handleTopicChange = (selectedTopic) => {
    const selectedTopicId = selectedTopic.value;

    const topic = topics.find((t) => t._id === selectedTopicId);
    const categories = topic ? topic.categories || [] : [];

    setTopicId(selectedTopicId);
    setCategoryId(categories.length > 0 ? categories[0]._id : "");
  };

  const renderTopics = (formProps: IFormProps) => {
    return (
      <FormGroup>
        <ControlLabel required={true}>Choose the knowledgebase</ControlLabel>
        <br />

        <Select
          {...formProps}
          placeholder={__("Choose knowledgebase")}
          value={generateOptions(topics).find((o) => o.value === topicId)}
          options={generateOptions(topics)}
          onChange={handleTopicChange}
          isClearable={false}
        />
      </FormGroup>
    );
  };

  const handleCategoryChange = (selectedCategory) => {
    setCategoryId(selectedCategory.value);
  };

  const renderCategories = (formProps: IFormProps) => {
    const topic = topics.find((t) => t._id === topicId);

    const categories = topic ? topic.categories || [] : [];

    return (
      <FormGroup>
        <ControlLabel required={true}>Choose the category</ControlLabel>
        <br />

        <Select
          {...formProps}
          placeholder={__("Choose category")}
          value={generateOptions(categories).find(
            (o) => o.value === categoryId
          )}
          options={generateOptions(categories)}
          onChange={handleCategoryChange}
          isClearable={false}
        />
      </FormGroup>
    );
  };

  const handleErxesFormChange = (
    index: number,
    key: string,
    value: string | number
  ) => {
    const updatedErxesForms = [...erxesForms];
    updatedErxesForms[index][key] = value;
    setErxesForms(updatedErxesForms);
  };

  const addErxesForm = () => {
    setErxesForms((prevForms) => [
      ...prevForms,
      {
        brandId: "",
        formId: "",
      },
    ]);
  };

  const removeErxesForm = (index: number) => () => {
    const updatedErxesForms = [...erxesForms];
    updatedErxesForms.splice(index, 1);

    setErxesForms(updatedErxesForms);
  };

  const renderErxesForm = (
    index: number,
    form: IErxesForm,
    formProps: IFormProps
  ) => {
    return (
      <FlexRow key={index}>
        <FormGroup>
          <ControlLabel required={true}>{__("Brand id")}</ControlLabel>
          <FormControl
            {...formProps}
            name="brandId"
            required={true}
            value={form.brandId}
            onChange={(e: any) =>
              handleErxesFormChange(index, "brandId", e.target.value)
            }
          />
        </FormGroup>

        <FormGroup>
          <ControlLabel required={true}>{__("Form id")}</ControlLabel>
          <FormControl
            {...formProps}
            name="formId"
            required={true}
            value={form.formId}
            onChange={(e: any) =>
              handleErxesFormChange(index, "formId", e.target.value)
            }
          />
        </FormGroup>

        <Button size="small" btnStyle="danger" onClick={removeErxesForm(index)}>
          <Icon icon="cancel-1" />
        </Button>
      </FlexRow>
    );
  };

  const renderContent = (formProps: IFormProps) => {
    const attachment = getFirstAttachment();

    const mimeTypeOptions = FILE_MIME_TYPES.map((item) => ({
      value: item.value,
      label: `${item.label} (${item.extension})`,
    }));

    const { isSubmitted, values } = formProps;

    const object = article || ({} as IArticle);

    const statusOptions = [{ value: "draft" }, { value: "publish" }].map(
      (option) => ({
        value: option.value,
        label: option.value,
      })
    );

    return (
      <>
        <FormGroup>
          <ControlLabel required={true}>{__("Title")}</ControlLabel>
          <FormControl
            {...formProps}
            name="title"
            defaultValue={object.title}
            required={true}
            autoFocus={true}
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>{__("Code")}</ControlLabel>
          <FormControl {...formProps} name="code" defaultValue={object.code} />
        </FormGroup>

        <FormGroup>
          <ControlLabel>{__("Summary")}</ControlLabel>
          <FormControl
            {...formProps}
            name="summary"
            defaultValue={object.summary}
          />
        </FormGroup>

        <FlexContent>
          <FlexItem count={4}>
            <FormGroup>
              <ControlLabel required={true}>{__("Reactions")}</ControlLabel>
              <Select
                isMulti={true}
                value={articleReactions.filter((o) =>
                  reactionChoices.includes(o.value)
                )}
                options={articleReactions}
                onChange={handleReactionsChange}
                components={{ Option, MultiValue }}
                placeholder={__("Select")}
              />
            </FormGroup>
          </FlexItem>
          <FlexItem count={2} $hasSpace={true}>
            <FormGroup>
              <ControlLabel required={true}>{__("Status")}</ControlLabel>
              <Select
                {...formProps}
                placeholder={__("Choose knowledgebase")}
                value={statusOptions.find(
                  (o) => o.value === (status || "draft")
                )}
                options={statusOptions}
                onChange={handleStatusChange}
                isClearable={false}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel required={true}>{__("isPrivate")}</ControlLabel>
              <FormControl
                componentclass="checkbox"
                checked={isPrivate}
                onChange={onChangeIsCheckDate}
              />
            </FormGroup>
          </FlexItem>
        </FlexContent>

        <FlexContent>
          <FlexItem count={3}>{renderTopics(formProps)}</FlexItem>
          <FlexItem count={3} $hasSpace={true}>
            {renderCategories(formProps)}
          </FlexItem>
        </FlexContent>

        <FormGroup>
          <ControlLabel>{__("Image")}</ControlLabel>
          <Uploader
            defaultFileList={image ? [image] : []}
            onChange={handleImageChange}
            single={true}
          />
        </FormGroup>

        <FormGroup>
          <ControlLabel>{__("Attachment")}</ControlLabel>
          <Uploader
            defaultFileList={attachments}
            onChange={handleAttachmentsChange}
            single={true}
          />
        </FormGroup>

        <FlexContent>
          <FlexItem count={2} $hasSpace={true}>
            <FormGroup>
              <ControlLabel>{__("File url")}</ControlLabel>
              <FormControl
                placeholder="Url"
                value={attachment.url || ""}
                onChange={(e: any) =>
                  handleAttachmentChange("url", e.target.value)
                }
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{__("File name")}</ControlLabel>
              <FormControl
                placeholder="Name"
                value={attachment.name || ""}
                onChange={(e: any) =>
                  handleAttachmentChange("name", e.target.value)
                }
              />
            </FormGroup>
          </FlexItem>
          <FlexItem count={2} $hasSpace={true}>
            <FormGroup>
              <ControlLabel>{__("File size (byte)")}</ControlLabel>
              <FormControl
                placeholder="Size (byte)"
                value={attachment.size || ""}
                type="number"
                onChange={(e: any) =>
                  handleAttachmentChange("size", parseInt(e.target.value, 10))
                }
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{__("File type")}</ControlLabel>
              <FormControl
                componentclass="select"
                value={attachment.type || ""}
                onChange={(e: any) =>
                  handleAttachmentChange("type", e.target.value)
                }
                options={[
                  { value: "", label: "Select type" },
                  ...mimeTypeOptions,
                ]}
              />
            </FormGroup>
          </FlexItem>
          <FlexItem count={2} $hasSpace={true}>
            <FormGroup>
              <ControlLabel>{__("File duration (sec)")}</ControlLabel>
              <FormControl
                placeholder="Duration"
                value={attachment.duration || 0}
                onChange={(e: any) =>
                  handleAttachmentChange(
                    "duration",
                    parseInt(e.target.value, 10)
                  )
                }
              />
            </FormGroup>
          </FlexItem>
        </FlexContent>

        <FormGroup>
          <ControlLabel>{__("erxes forms")}</ControlLabel>
          <Forms>
            {erxesForms.map((form, index) =>
              renderErxesForm(index, form, formProps)
            )}
          </Forms>

          <Button
            btnStyle="simple"
            size="small"
            onClick={addErxesForm}
            icon="add"
          >
            Add another form
          </Button>
        </FormGroup>

        <FormGroup>
          <ControlLabel required={true}>{__("Content")}</ControlLabel>
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            isSubmitted={isSubmitted}
            height={300}
            name={`knowledgeBase_${article ? article._id : "create"}`}
          />
        </FormGroup>

        <ModalFooter>
          <Button
            btnStyle="simple"
            type="button"
            onClick={closeModal}
            icon="times-circle"
          >
            {__("Cancel")}
          </Button>

          {renderButton({
            passedName: "article",
            values: generateDoc(values),
            isSubmitted,
            callback: closeModal,
            object: article,
          })}
        </ModalFooter>
      </>
    );
  };

  return <Form renderContent={renderContent} />;
};

export default ArticleForm;
