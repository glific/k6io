import http from "k6/http";

import {
  post_gql,
  setup as setup_helper
} from './../helpers';

const BASE_URL = 'http://glific.test:4000';

export const setup = () => {
  let access_token = setup_helper();
  let contacts_query_response = contacts_query(access_token);
  let contacts = contacts_query_response.contacts;
  return { access_token, contacts };
}

function contacts_query(access_token: string) : any {
  let query = `
    query contacts($filter: ContactFilter) {
      contacts(filter: $filter) {
        id
        name
        phone
      }
    }
  `;

  let filter = { providerStatus: "SESSION_AND_HSM" }
  let variables = { filter }

  return post_gql(query, access_token, variables)
}

export function inbound_message(message_body: string, contact: any) : any {

  let message_request_params = {
    "app": "GLIFICAPP",
    "timestamp": 1580227766370,
    "version": 2,
    "type": "message",
    "payload": {
      "type": "text",
      "id": "ABEGkYaYVSEEAhAL3SLAWwHKeKrt6s3FKB0c",
      "source": contact.phone,
      "payload": {
        "text": message_body
      },
      "sender": {
        "phone": contact.phone,
        "name": contact.name,
        "country_code": "91",
        "dial_code": "78xxx1xxx1"
      }
    }
  }

  let headers = {
    "Content-Type": "application/json"
  };

  let res = http.post(
    `${BASE_URL}/gupshup`,
    JSON.stringify(message_request_params),
    { headers }
  );

  return res;
}

export function search_query(access_token: string, contact: any) : any {
  let query = `
    query search(
      $saveSearchInput: SaveSearchInput
      $searchFilter: SearchFilter!
      $contactOpts: Opts!
      $messageOpts: Opts!
    ) {
      search(
        filter: $searchFilter
        saveSearchInput: $saveSearchInput
        contactOpts: $contactOpts
        messageOpts: $messageOpts
      ) {
        messages {
          id
          body
          tags {
            label
          }
        }

        contact {
          name
        }
      }
    }
  `;

  let searchFilter = {
    term: "",
    id: `${contact.id}`
  }
  let messageOpts = {
    limit: 1,
    order: "ASC"
  }
  let contactOpts = {
    order: "DESC",
    limit: 1
  }

  let variables = { searchFilter, messageOpts, contactOpts }

  return post_gql(query, access_token, variables);
}

export function count_messages_query(access_token: string, contact: any) : any {
  let query = `
    query countMessages($filter: MessageFilter) {
      countMessages(filter: $filter)
    }
  `;

  let filter = {
    either: `${contact.phone}`
  }

  let variables = { filter }

  return post_gql(query, access_token, variables);
}