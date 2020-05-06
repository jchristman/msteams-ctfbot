const default_input = title => ({
  id: title.toLowerCase().replace(/\W/g, ""),
  placeholder: `Enter the ${title.toLowerCase()}`,
  type: "Input.Text",
  value: null
});

export default (
  title = "Title",
  submitLocation = "default",
  input_array = []
) => {
  const card = {
    actions: [
      {
        data: {
          submitLocation
        },
        title: "Submit",
        type: "Action.Submit"
      }
    ],
    body: [
      {
        text: title,
        type: "TextBlock",
        weight: "bolder"
      }
    ],
    type: "AdaptiveCard",
    version: "1.0"
  };

  input_array.forEach(({ title, input = null }) => {
    card.body.push({ type: "TextBlock", text: title });
    card.body.push(input || default_input(title));
  });

  return card;
};
