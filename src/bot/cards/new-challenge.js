import GenericCard from "./generic.js";
import { NEW_CHALLENGE_SUBMIT, CATEGORIES } from "./constants.js";

export default GenericCard("New Challenge", NEW_CHALLENGE_SUBMIT, [
  {
    title: "Name"
  },
  {
    title: "Points"
  },
  {
    title: "Description"
  },
  {
    title: "Category",
    input: {
      type: "Input.ChoiceSet",
      id: "category",
      style: "compact",
      choices: CATEGORIES.map(cat => ({
        title: cat,
        value: cat
      }))
    }
  }
]);
