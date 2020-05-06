const { CardFactory } = require("botbuilder");

export class AdaptiveCardHelper {
  static createAdaptiveCardEditor(card) {
    return CardFactory.adaptiveCard(card);
  }
}
