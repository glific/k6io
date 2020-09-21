import http from "k6/http";
import { check } from 'k6';
import { Options } from 'k6/options';

import {
  sleep_delay,
  post_gql,
  setup as setup_helper
} from './helpers';

const BASE_URL = 'http://glific.test:4000';

export let options: Options = {
    vus: 10,
    iterations: 20
};

export const setup = () => {
  let access_token = setup_helper();
  let contacts_query_response = contacts_query(access_token);
  let contacts = contacts_query_response.contacts;
  return { access_token, contacts };
}

export default function (data: any) {
  let access_token = data.access_token;
  let contacts = data.contacts;
  let contact_index = getRandomInteger(0, contacts.length - 1);

  let flow_keyword = "help"
  let response = inbound_message(flow_keyword, contacts[contact_index])
  check(response, {
    'received flow keyword successfully': () =>
      response.status === 200
  });
  sleep_delay()

  let search_query_response = search_query(access_token, contacts[contact_index].id);
  check(search_query_response, {
    'sent first flow message successfully': () =>
      search_query_response.search[0].messages[0].body !== flow_keyword
  });

  response = inbound_message("2", contacts[contact_index])
  check(response, {
    'received first response message successfully': () =>
      response.status === 200
  });
  sleep_delay()

  search_query_response = search_query(access_token, contacts[contact_index].id);
  check(search_query_response, {
      'sent second flow message successfully': () =>
      search_query_response.search[0].messages[0].body !== "2"
  });
}

function getRandomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function contacts_query(access_token: string) {
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

function inbound_message(message_body: string, contact: any) {

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

function search_query(access_token: string, contact_id: number) {
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
    id: `${contact_id}`
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
