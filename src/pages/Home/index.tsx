import React, {
  useState,
  useEffect,
  useContext,
  ChangeEvent,
  FormEvent,
} from "react";
import { ThemeContext } from "styled-components";
import axios from "axios";
import qs from "qs";
import { BounceLoader } from "react-spinners";

import { useToast } from "../../hooks/toast";

import logo from "../../assets/logo.svg";
import logoDark from "../../assets/logo-dark.svg";

import {
  Container,
  Card,
  Templates,
  Form,
  Button,
  GeneratedMeme,
  PreviewMeme,
} from "./styles";

interface TemplateData {
  id: string;
  url: string;
  name: string;
  box_count: number;
}

const Home = () => {
  const theme = useContext(ThemeContext);
  const { addToast } = useToast();
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(
    null
  );
  const [formData, setFormData] = useState<string[]>([]);
  const [generatedMeme, setGeneratedMeme] = useState<string>("");
  const [previewMeme, setPreviewMeme] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  useEffect(() => {
    axios
      .get("https://api.imgflip.com/get_memes")
      .then((response) => {
        setTemplates(response.data.data.memes as TemplateData[]);
      })
      .catch((err) => {
        addToast({
          type: "error",
          title: "Load error",
          description: "Something went wrong getting the memes template",
        });
      });
  }, [addToast]);

  const handleSelectTemplate = async (template: TemplateData) => {
    setSelectedTemplate(template);
    setFormData([]);

    const previewArray = new Array(template.box_count)
      .fill(0)
      .map((_, index) => `TEXT #${index + 1}`);

    const params = qs.stringify({
      template_id: template.id,
      username: "YagoPereira",
      password: "ypazevedo",
      boxes: previewArray.map((text) => ({ text })),
    });

    try {
      setLoadingPreview(true);
      const res = await axios.get(
        `https://api.imgflip.com/caption_image?${params}`
      );
      setPreviewMeme(res.data?.data?.url);
      setLoadingPreview(false);
    } catch (err) {
      addToast({
        type: "error",
        title: "Load error",
        description: "Could not load preview",
      });
      setLoadingPreview(false);
    }
  };

  const handleChange = (index: number) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const newValues = [...formData];
    newValues[index] = e.target.value;
    setFormData(newValues);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const params = qs.stringify({
      template_id: selectedTemplate?.id,
      username: "YagoPereira",
      password: "ypazevedo",
      boxes: formData.map((text) => ({ text })),
    });

    try {
      const res = await axios.get(
        `https://api.imgflip.com/caption_image?${params}`
      );
      setGeneratedMeme(res.data?.data?.url);
      addToast({
        type: "success",
        title: "Meme generated!",
        description: "Meme successfully generated",
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Server error",
        description: "Something went generating your meme",
      });
    }
  };

  const handleResetMemes = () => {
    setGeneratedMeme("");
    setFormData([]);
    setSelectedTemplate(null);
    setPreviewMeme("");
  };

  return (
    <Container>
      <img src={theme.title === "dark" ? logoDark : logo} alt="meme-maker" />

      <Card>
        {generatedMeme && (
          <GeneratedMeme>
            <img src={generatedMeme} alt="generated-meme" width={500} />
            <Button type="button" onClick={() => handleResetMemes()}>
              Go back and make more memes!
            </Button>
          </GeneratedMeme>
        )}
        {!generatedMeme && (
          <React.Fragment>
            <h2>Select your template:</h2>

            <Templates>
              {templates &&
                templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={
                      template.id === selectedTemplate?.id
                        ? "selected-template"
                        : ""
                    }
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <img src={template.url} alt={template.name} />
                  </button>
                ))}
            </Templates>
            {previewMeme && !loadingPreview && (
              <PreviewMeme>
                <img src={previewMeme} alt="preview-meme" width={300} />
              </PreviewMeme>
            )}
            {loadingPreview && (
              <PreviewMeme>
                <BounceLoader color="#FC771D" />
              </PreviewMeme>
            )}
            {selectedTemplate && (
              <React.Fragment>
                <h2>Texts:</h2>
                <Form onSubmit={handleSubmit}>
                  {new Array(selectedTemplate.box_count)
                    .fill(0)
                    .map((_, index) => (
                      <input
                        key={index}
                        placeholder={`TEXT #${index + 1}`}
                        onChange={handleChange(index)}
                        value={formData[index] ? formData[index] : ""}
                      />
                    ))}
                  <Button type="submit">Make my meme!</Button>
                </Form>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </Card>
    </Container>
  );
};

export default Home;
