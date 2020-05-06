import GenericCard from "./generic.js";
import {
  START_NEW_OR_LOAD_TASK,
  NEW_CTF_REQUEST,
  LOAD_CTF_REQUEST
} from "./constants.js";

export default past_ctfs => {
  const card = {
    actions: [
      {
        data: {
          submitLocation: NEW_CTF_REQUEST
        },
        title: "New CTF",
        type: "Action.Submit"
      }
    ],
    body: [],
    type: "AdaptiveCard",
    version: "1.0"
  };

  if (past_ctfs.length === 0) {
    card.body.push({
      text: `There are no CTFs in the database. Click "New CTF" to start a new one.`,
      type: "TextBlock",
      weight: "bolder",
      wrap: true
    });
  } else {
    card.actions.unshift({
      data: {
        submitLocation: LOAD_CTF_REQUEST
      },
      title: "Load CTF",
      type: "Action.Submit"
    });

    card.body = card.body.concat([
      {
        text: `Select a CTF to load, or click "New CTF"`,
        type: "TextBlock",
        weight: "bolder"
      },
      {
        type: "Input.ChoiceSet",
        id: "ctf_index",
        style: "compact",
        choices: past_ctfs.map((ctf, index) => ({
          title: ctf.name,
          value: `${index}`
        }))
      }
    ]);
  }

  return card;
};
