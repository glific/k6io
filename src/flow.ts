import http from "k6/http";
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

import {
  post_gql,
  setup as setup_helper
} from './helpers';

const BASE_URL = 'http://glific.test:4000';

export let options: Options = {
  // vus: 3,
  // iterations: 3
};

export const setup = () => setup_helper()

export default function (access_token: string) {
  let contacts_query_response = contacts_query(access_token);
  let contacts = contacts_query_response.contacts
  let contact_index = 0

  let res = inbound_message("help", contacts[contact_index])
  check(res, {
    'received flow keyword successfully': () =>
      res.status === 200
  });
  sleep(1)

  let search_query_response = search_query(access_token, contacts[contact_index].id);
  check(search_query_response, {
    'sent flow response message successfully': () =>
      search_query_response.search[0].messages[0].body !== "help"
  });

  let res_2 = inbound_message("1", contacts[contact_index])
  check(res_2, {
    'received flow message successfully': () =>
      res_2.status === 200
  });
  sleep(1)

  let search_query_response_2 = search_query(access_token, contacts[contact_index].id);
  check(search_query_response_2, {
    'sent another response message successfully': () =>
      search_query_response_2.search[0].messages[0].body !== "1"
  });
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

  let filter = { providerStatus: "SESSION" }
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