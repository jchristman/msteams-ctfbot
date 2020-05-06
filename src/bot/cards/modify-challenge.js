import GenericCard from "./generic.js";
import {
  NEW_CHALLENGE_SUBMIT,
  MODIFY_CHALLENGE_SUBMIT,
  SOLVE_CHALLENGE,
  CATEGORIES
} from "./constants.js";

export default challenge => {
  const card = challenge
    ? GenericCard("Modify Challenge", MODIFY_CHALLENGE_SUBMIT, [
        {
          title: "Name",
          input: {
            type: "Input.Text",
            placeholder: "Enter the name",
            id: "name",
            value: challenge.name
          }
        },
        {
          title: "Description",
          input: {
            type: "Input.Text",
            placeholder: "Enter the description",
            id: "description",
            value: challenge.description
          }
        },
        {
          title: "Points",
          input: {
            type: "Input.Text",
            placeholder: "Enter the points",
            id: "points",
            value: challenge.points
          }
        },
        {
          title: "Category",
          input: {
            type: "Input.ChoiceSet",
            id: "category",
            style: "compact",
            value: challenge.category,
            choices: CATEGORIES.map(cat => ({
              title: cat,
              value: cat
            }))
          }
        }
      ])
    : null;

  if (card !== null) {
    card.actions[0].data.challenge_id = challenge._id;
    card.actions.unshift({
      data: {
        submitLocation: SOLVE_CHALLENGE,
        challenge_id: challenge._id
      },
      title: "Mark as Solved",
      type: "Action.Submit"
    });
  }

  return card;
};
