import _ from "lodash";
import mongoose from "mongoose";
import {
  TeamsActivityHandler,
  CardFactory,
  TeamsInfo,
  MessageFactory
} from "botbuilder";
import { AdaptiveCardHelper } from "./adaptive-card-helper.js";
import { CardResponseHelpers } from "./card-response-helpers.js";
import { db } from "../server.js";

import * as CONSTANTS from "./cards/constants.js";
import ActiveCTFCard from "./cards/active-ctf.js";
import ModifyChallengeCard from "./cards/modify-challenge.js";
import NewChallengeCard from "./cards/new-challenge.js";
import StartCTFCard from "./cards/start-ctf.js";
import StartNewOrLoadCTFCard from "./cards/start-or-load-ctf.js";

export class TeamsMessagingExtensionsActionBot extends TeamsActivityHandler {
  constructor(teams_client) {
    super();

    this.main_channel = null;
    this.conversationRef = null;
    this.teams_client = teams_client;
    this.team_details = null;
    this.ctf_tracker = new CTFTracker(this);
  }

  async sendMessageToChannel(context, text, mentions = []) {
    const message = MessageFactory.text(text);
    message.entities = mentions;

    const conv_params = {
      isGroup: true,
      channelData: {
        channel: {
          id: this.main_channel
        }
      },
      activity: message
    };

    try {
      const connectorClient = context.adapter.createConnectorClient(
        context.activity.serviceUrl
      );
      const conversationResourceResponse = await connectorClient.conversations.createConversation(
        conv_params
      );
      this.conversationRef.conversation.id = conversationResourceResponse.id;
    } catch (e) {
      console.error(e);
    }
  }

  handleTeamsMessagingExtensionFetchTask(context, action) {
    const participant = this.ctf_tracker.track_participant(
      context?._activity?.from ?? null
    );
    this.ctf_tracker.track_participant(participant);

    const adaptiveCard = AdaptiveCardHelper.createAdaptiveCardEditor(
      this.ctf_tracker.status(participant)
    );

    return CardResponseHelpers.toTaskModuleResponse(adaptiveCard);
  }

  async handleTeamsMessagingExtensionSubmitAction(context, action) {
    const participant = this.ctf_tracker.track_participant(
      context?._activity?.from ?? null
    ) ?? { name: "Unknown User" };

    let adaptiveCard = null,
      challenge_name = null,
      mentions = null,
      ctf = null;

    switch (action.data.submitLocation) {
      case CONSTANTS.START_CTF_TASK:
        console.log(`${participant.name} has started a CTF`, action.data);
        ctf = this.ctf_tracker.start_ctf(action.data);

        this.sendMessageToChannel(
          context,
          `${ctf.name} is loaded.\n\nSite: ${ctf.url}\n\nUsername: ${ctf.username}\n\nPassword: ${ctf.password}`
        );

        return null;
      case CONSTANTS.LOAD_CTF_REQUEST:
        console.log(`${participant.name} has loaded a CTF`, action.data);
        ctf = this.ctf_tracker.load_ctf(action.data);

        this.sendMessageToChannel(
          context,
          `${ctf.name} is loaded.\n\nSite: [${ctf.url}](${ctf.url})\n\nUsername: ${ctf.username}\n\nPassword: ${ctf.password}`
        );

        return null;
      case CONSTANTS.NEW_CTF_REQUEST:
        console.log(`${participant.name} has requested a new CTF`);
        adaptiveCard = AdaptiveCardHelper.createAdaptiveCardEditor(
          StartCTFCard
        );
        return CardResponseHelpers.toTaskModuleResponse(adaptiveCard);
      case CONSTANTS.NEW_CHALLENGE_REQUEST:
        console.log(`${participant.name} has requested a new Challenge`);
        adaptiveCard = AdaptiveCardHelper.createAdaptiveCardEditor(
          NewChallengeCard
        );
        return CardResponseHelpers.toTaskModuleResponse(adaptiveCard);
      case CONSTANTS.NEW_CHALLENGE_SUBMIT:
        console.log(
          `${participant.name} has submitted a new Challenge`,
          action.data
        );

        const challenge = await this.ctf_tracker.new_challenge(action.data);
        adaptiveCard = AdaptiveCardHelper.createAdaptiveCardEditor(
          this.ctf_tracker.status(participant)
        );

        mentions = [
          /*{
            mentioned: participant,
            text: `<at>${participant.name}</at>`,
            type: "mention"
          },*/
          /*{
            mentioned: challenge.channel,
            text: `<at>${challenge.channel.displayName}</at>`,
            type: "mention"
          }*/
        ];

        this.sendMessageToChannel(
          context,
          //`${mentions[0].text} has registered a new ${challenge.category} challenge. Head over to ${mentions[1].text} to work on it.`,
          `${challenge.name} (${challenge.category}, ${challenge.points} points) has been started. Head over to [${challenge.channel.displayName}](${challenge.channel.webUrl}) to work on it!\n\nDescription: ${challenge.description}`,
          mentions
        );

        return CardResponseHelpers.toTaskModuleResponse(adaptiveCard);
      case CONSTANTS.MODIFY_CHALLENGE_REQUEST:
        console.log(`${participant.name} has requested to modify a Challenge`);
        adaptiveCard = AdaptiveCardHelper.createAdaptiveCardEditor(
          ModifyChallengeCard(
            this.ctf_tracker.get_challenge(action.data.challenge_id)
          ) ?? this.ctf_tracker.status(participant)
        );
        return CardResponseHelpers.toTaskModuleResponse(adaptiveCard);
      case CONSTANTS.MODIFY_CHALLENGE_SUBMIT:
        console.log(
          `${participant.name} has submitted a modified Challenge`,
          action.data
        );
        this.ctf_tracker.modify_challenge(action.data);
        adaptiveCard = AdaptiveCardHelper.createAdaptiveCardEditor(
          this.ctf_tracker.status(participant)
        );
        return CardResponseHelpers.toTaskModuleResponse(adaptiveCard);
      case CONSTANTS.WORK_CHALLENGE_REQUEST:
        challenge_name = this.ctf_tracker.work_challenge(
          action.data,
          participant
        );
        console.log(
          `${participant.name} has toggled working on ${challenge_name}`
        );
        adaptiveCard = AdaptiveCardHelper.createAdaptiveCardEditor(
          this.ctf_tracker.status(participant)
        );
        return CardResponseHelpers.toTaskModuleResponse(adaptiveCard);
      case CONSTANTS.SOLVE_CHALLENGE:
        challenge_name = this.ctf_tracker.solve_challenge(
          action.data,
          participant
        );
        console.log(`${participant.name} has solved ${challenge_name}`);

        mentions = [
          {
            mentioned: participant,
            text: `<at>${participant.name}</at>`,
            type: "mention"
          }
          /*{
            mentioned: challenge.channel,
            text: `<at>${challenge.channel.displayName}</at>`,
            type: "mention"
          }*/
        ];
        this.sendMessageToChannel(
          context,
          `${mentions[0].text} has solved  ${challenge_name}! \u{1F44F}`,
          mentions
        );

        adaptiveCard = AdaptiveCardHelper.createAdaptiveCardEditor(
          this.ctf_tracker.status(participant)
        );
        return CardResponseHelpers.toTaskModuleResponse(adaptiveCard);
      case CONSTANTS.UPDATE_PREFERENCES:
        console.log(`${participant.name} has updated preferences`);
        this.ctf_tracker.update_preferences(action.data, participant);
        adaptiveCard = AdaptiveCardHelper.createAdaptiveCardEditor(
          this.ctf_tracker.status(participant)
        );
        return CardResponseHelpers.toTaskModuleResponse(adaptiveCard);
      case CONSTANTS.END_CTF:
        console.log(`${participant.name} has ended the CTF`);
        this.ctf_tracker.end_ctf();
        return null;
      default:
        return null;
    }
  }
}

const ctfSchema = new mongoose.Schema({
  name: String,
  active: Boolean,
  url: String,
  username: String,
  password: String,
  participants: [
    {
      id: String,
      name: String,
      hide_solved: Boolean,
      filters: [
        {
          category_name: String,
          hidden: false
        }
      ]
    }
  ],
  challenges: [
    {
      name: String,
      description: String,
      points: Number,
      solved: Boolean,
      category: String,
      channel: {
        displayName: String,
        description: String,
        webUrl: String,
        id: String
      },
      working: [
        {
          id: String,
          name: String
        }
      ]
    }
  ]
});

const CTFModel = mongoose.model("CTF", ctfSchema);

class CTFTracker {
  constructor(bot) {
    this.current = null;
    this.bot = bot;
    this.admins = ["Joshua Christman"];

    const loadCTFs = async () => {
      if (db !== null) {
        this.past_ctfs = await CTFModel.find().exec();
        this.current = _.find(this.past_ctfs, "active") ?? null;

        console.log(`Current CTF: ${this.current?.name ?? "None"}`);
        console.log(
          `Count of CTFs available to load: ${this.past_ctfs.length}`
        );
      } else {
        console.log(`Waiting for connection to db to load CTFs`);
        setTimeout(loadCTFs, 500);
      }
    };

    setTimeout(loadCTFs, 500);
  }

  track_participant(participant) {
    if (this.current === null) return participant;
    let index = _.findIndex(
      this.current.participants,
      _participant => _participant.id === participant.id
    );

    if (index === -1) {
      _.extend(participant, {
        hide_solved: true,
        filters: CONSTANTS.CATEGORIES.map(name => ({
          category_name: name,
          hidden: false
        }))
      });
      this.current.participants.push(participant);
      index = this.current.participants.length - 1;
      this.current.save();
    }

    return this.current.participants[index];
  }

  update_preferences(data, participant) {
    const participant_index = _.findIndex(
      this.current.participants,
      p => p.id === participant.id
    );

    this.current.participants[participant_index].hide_solved = JSON.parse(
      data.hide_solved.toLowerCase()
    );
    _.each(data, (value, key) => {
      if (key.startsWith("filter")) {
        const filter_id = key.split(".")[1];
        const filter_index = _.findIndex(
          this.current.participants[participant_index].filters,
          f => f._id.toString() === filter_id
        );

        this.current.participants[participant_index].filters[
          filter_index
        ].hidden = JSON.parse(value.toLowerCase());
      }
    });

    this.current.save();
  }

  status(participant) {
    const isAdmin =
      _.findIndex(
        this.admins,
        admin_name => admin_name === participant.name
      ) !== -1;
    if (this.current === null) {
      return StartNewOrLoadCTFCard(this.past_ctfs);
    } else {
      const personalized_current = _.cloneDeep(this.current);

      // Filter out hidden challenges
      personalized_current.challenges = _.filter(
        personalized_current.challenges,
        challenge => {
          if (participant.hide_solved && challenge.solved) {
            return false;
          }

          for (let filter of participant.filters) {
            if (filter.hidden && filter.category_name === challenge.category) {
              return false;
            }
          }

          return true;
        }
      );

      // Adjust challenge name if we are working on it
      personalized_current.challenges = personalized_current.challenges.map(
        challenge => {
          if (
            _.find(challenge.working, p => p.id === participant?.id) !==
            undefined
          ) {
            challenge.name = `${challenge.name} (working)`;
          }
          return challenge;
        }
      );

      const preferences = {
        hide_solved: participant.hide_solved,
        filters: participant.filters
      };

      return ActiveCTFCard(personalized_current, preferences, isAdmin);
    }
  }

  start_ctf(data) {
    const doc = new CTFModel({
      ...data,
      admin: "Joshua Christman",
      active: true
    });
    doc.save();

    console.log("Started CTF", doc);
    this.current = doc;

    return this.current;
  }

  load_ctf({ ctf_index = -1 }) {
    if (ctf_index === -1) {
      return null;
    }

    this.current = this.past_ctfs[ctf_index];
    console.log(`Loading ${this.current.name}`);
    this.current.active = true;
    this.current.save();

    return this.current;
  }

  end_ctf() {
    this.current.active = false;
    this.current.save();
    this.current = null;
  }

  async new_challenge({ name, points, category, description }) {
    const _points = Number(points);

    const challenge = {
      name,
      description,
      points: isNaN(_points) ? 0 : _points,
      category,
      solved: false,
      working: []
    };

    const channel = await this.create_channel(name, description);
    challenge.channel = channel;

    this.current.challenges.push(challenge);
    this.current.save();

    return challenge;
  }

  get_challenge(challenge_id) {
    return _.find(
      this.current.challenges,
      challenge => challenge._id.toString() === challenge_id
    );
  }

  modify_challenge({ challenge_id = null, ...other }) {
    if (challenge_id === null) {
      return;
    }

    const index = _.findIndex(
      this.current.challenges,
      challenge => challenge._id.toString() === challenge_id
    );

    Object.assign(this.current.challenges[index], other);
    this.current.save();
  }

  work_challenge({ challenge_id = null }, participant = null) {
    if (participant?.id === undefined || challenge_id === null) {
      return;
    }

    const index = _.findIndex(
      this.current.challenges,
      challenge => challenge._id.toString() === challenge_id
    );

    const working_index = _.findIndex(
      this.current.challenges[index].working,
      p => p.id === participant.id
    );

    if (working_index === -1) {
      this.current.challenges[index].working.push(participant);
      this.current.save();
    } else {
      this.current.challenges[index].working.splice(working_index, 1);
      this.current.save();
    }

    return this.current.challenges[index].name;
  }

  solve_challenge({ challenge_id }) {
    const index = _.findIndex(
      this.current.challenges,
      challenge => challenge._id.toString() === challenge_id
    );

    this.current.challenges[index].solved = true;
    this.current.save();

    return this.current.challenges[index].name;
  }

  async create_channel(displayName, description) {
    displayName = displayName.replace(/([^a-z0-9_ ]+)/gi, "");

    const channel = {
      displayName,
      description
    };

    const res = await this.bot.teams_client
      .api(`/teams/${this.bot.team_details.aadGroupId}/channels`)
      .post(channel);

    return res;
  }
}
