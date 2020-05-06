import fetch from "node-fetch";
import { URLSearchParams } from "url";

class MyAuthenticationProvider {
  constructor(appId, tenantId, secret) {
    this.appId = appId;
    this.tenantId = tenantId;
    this.secret = secret;
    this.token = null;

    this.AUTH_URL = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
  }

  async getAccessToken() {
    try {
      if (this.token === null) {
        console.log("Fetching access token");
        const body = `client_id=${this.appId}&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default&client_secret=${this.secret}&grant_type=client_credentials`;

        const raw_result = await fetch(this.AUTH_URL, {
          method: "post",
          body,
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const json_result = await raw_result.json();

        this.token = json_result.access_token;
        console.log("Retrieved access token");
      } else {
        console.log("Used cached access token");
      }
    } catch (e) {
      console.error(e);
      this.token = null;
    }

    return this.token;
  }
}

export default MyAuthenticationProvider;
