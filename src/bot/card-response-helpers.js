const { MessageFactory, InputHints } = require("botbuilder");

export class CardResponseHelpers {
  static toTaskModuleResponse(cardAttachment, title = "") {
    return {
      task: {
        type: "continue",
        value: {
          card: cardAttachment,
          height: 450,
          title,
          url: null,
          width: 500
        }
      }
    };
  }
}
