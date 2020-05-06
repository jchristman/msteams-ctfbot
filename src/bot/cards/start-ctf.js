import GenericCard from "./generic.js";
import { START_CTF_TASK } from "./constants.js";

export default GenericCard("Start CTF", START_CTF_TASK, [
  {
    title: "CTF Name",
    input: {
      id: "name",
      placeholder: `Enter the CTF Name`,
      type: "Input.Text",
      value: null
    }
  },
  {
    title: "URL",
    input: {
      id: "url",
      placeholder: "Enter the url",
      type: "Input.Text",
      value: "https://"
    }
  },
  {
    title: "Username"
  },
  {
    title: "Password"
  }
]);
