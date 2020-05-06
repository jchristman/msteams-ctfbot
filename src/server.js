import ps from "ps-node";
import path from "path";
import restify from "restify";
import mongoose from "mongoose";
import {
  BotFrameworkAdapter,
  TeamsInfo,
  TurnContext,
  teamsGetChannelId
} from "botbuilder";
import * as Msal from "msal";
import * as GraphClient from "@microsoft/microsoft-graph-client";
import CustomAuthProvider from "./custom-auth-provider.js";

import { TeamsMessagingExtensionsActionBot } from "./bot/messaging-extension-action-bot.js";
import { tenantId, appId, botAppId, botAppPassword } from "./config.js";

/* ---------------------------------------- */
// Setup for the Microsoft Graph Client

let clientOptions = {
  authProvider: new CustomAuthProvider(appId, tenantId, botAppPassword)
};

const TeamsClient = GraphClient.Client.initWithMiddleware(clientOptions);

/*(async () => {
  try {
    let res = await client
      .api(`/teams/9b8e0840-2f64-4ec5-aee3-ff7f387685be/channels`)
      .get();
    console.log(res);
  } catch (e) {
    console.error(e);
  }
})();*/

/* ---------------------------------------- */
// Setup the database connection

export let db = null;

const connectDB = () => {
  mongoose.connect("mongodb://localhost/scc", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function() {
    console.log("Connected to database");
  });
};

ps.lookup(
  {
    command: "mongod"
  },
  (err, results) => {
    if (err) {
      throw new Error(err);
    }

    if (results.length === 0) {
      console.log("Mongo DB is not started. Starting mongod now.");

      const spawn = require("child_process").spawn;

      const child = spawn("mongod", [], {
        detached: true,
        stdio: ["ignore"]
      });

      child.unref();
    } else {
      console.log("Mongo DB is already running");
    }
    connectDB();
  }
);

/* ---------------------------------------- */
// Setup the bot framework

const adapter = new BotFrameworkAdapter({
  appId: botAppId,
  appPassword: botAppPassword
});

adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError] unhandled error:`, error);
  await context.sendActivity(
    "The bot encountered an error or bug. Please inform @Joshua Christman of this issue"
  );
};

const bot = new TeamsMessagingExtensionsActionBot(TeamsClient);

/* ---------------------------------------- */
// Setup the REST server

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3333, function() {
  console.log(`\n${server.name} listening at ${server.url}`);
});

server.post("/messages", (req, res) => {
  adapter.processActivity(req, res, async context => {
    console.log("Bot invoked");

    if (bot.team_details === null) {
      bot.team_details = await TeamsInfo.getTeamDetails(context);
    }

    if (bot.main_channel === null) {
      bot.main_channel = teamsGetChannelId(context.activity);
    }

    if (bot.conversationRef === null) {
      bot.conversationRef = TurnContext.getConversationReference(
        context.activity
      );
    }

    await bot.run(context);
  });
});
