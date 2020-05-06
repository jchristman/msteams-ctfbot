import {
  NEW_CHALLENGE_REQUEST,
  MODIFY_CHALLENGE_REQUEST,
  WORK_CHALLENGE_REQUEST,
  UPDATE_PREFERENCES,
  END_CTF
} from "./constants.js";

export default (current, preferences) => {
  const card = {
    actions: [
      {
        data: {
          submitLocation: NEW_CHALLENGE_REQUEST
        },
        title: "New Challenge",
        type: "Action.Submit"
      }
    ],
    body: [],
    type: "AdaptiveCard",
    version: "1.0"
  };

  card.body = card.body.concat([
    {
      text: "Filters",
      type: "TextBlock",
      wrap: true
    },
    {
      type: "Input.Toggle",
      id: "hide_solved",
      title: "Hide solved challenges",
      value: preferences.hide_solved,
      valueOn: true,
      valueOff: false
    }
  ]);

  card.body = card.body.concat(
    preferences.filters.map(filter => ({
      type: "Input.Toggle",
      id: `filter.${filter._id}`,
      title: `Hide ${filter.category_name}`,
      value: filter.hidden,
      valueOn: true,
      valueOff: false
    }))
  );

  if (current.challenges.length === 0) {
    card.body.push({
      text: `There are no challenges to show. Click "New Challenge" to create one.`,
      type: "TextBlock",
      weight: "bolder",
      wrap: true
    });

    card.actions.unshift({
      data: {
        submitLocation: UPDATE_PREFERENCES
      },
      title: "Update Preferences",
      type: "Action.Submit"
    });
  } else {
    card.actions.unshift({
      data: {
        submitLocation: WORK_CHALLENGE_REQUEST
      },
      title: "Toggle Working Status",
      type: "Action.Submit"
    });

    card.actions.unshift({
      data: {
        submitLocation: MODIFY_CHALLENGE_REQUEST
      },
      title: "Modify Challenge",
      type: "Action.Submit"
    });

    card.actions.unshift({
      data: {
        submitLocation: UPDATE_PREFERENCES
      },
      title: "Update Preferences",
      type: "Action.Submit"
    });

    card.body = card.body.concat([
      {
        text: `Select a challenge to work on or modify, or click "New Challenge"`,
        type: "TextBlock",
        weight: "bolder"
      },
      {
        type: "Input.ChoiceSet",
        id: "challenge_id",
        style: "compact",
        choices: current.challenges.map((challenge, index) => ({
          title: challenge.name,
          value: challenge._id
        }))
      }
    ]);
  }

  return card;
};
