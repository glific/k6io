import http from "k6/http";
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

import {
  post_gql,
  setup as setup_helper
} from './helpers';

const BASE_URL = 'http://glific.test:4000';
const CONTACTPHONE = `917834811231`

export let options: Options = {
  // vus: 10,
  // duration: '1s',
};

export const setup = () => setup_helper()

export default function (access_token: string) {
  let contacts_query_response = contacts_query(access_token);
  let contact_id = contacts_query_response.contacts[0].id
  let contact_name = contacts_query_response.contacts[0].name

  let message_mutation_response = create_and_send_message_mutation(access_token, "new message", contact_id);
  check(message_mutation_response, {
    'stored outbound message successfully': () =>
      message_mutation_response.createAndSendMessage.message.body === "new message"
  });
  sleep(1)

  let message_query_response = get_message_by_id_query(access_token, message_mutation_response.createAndSendMessage.message.id);
  check(message_query_response, {
    'retrieved stored outbound message successfully': () =>
      message_query_response.message.message.body == message_mutation_response.createAndSendMessage.message.body,
  });

  let res = inbound_message("test_message", contact_name)
  check(res, {
    'stored inbound message successfully': () =>
      res.status === 200
  });
  sleep(2)

  let search_query_response = search_query(access_token, contact_id);
  check(search_query_response, {
    'retrieved stored inbound message successfully': () =>
      search_query_response.search[0].messages[0].body === "test_message",
    'tagged inbound message with Not replied': () =>
      search_query_response.search[0].messages[0].tags[0].label === "Not replied"
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

  let filter = { phone: CONTACTPHONE }
  let variables = { filter }

  return post_gql(query, access_token, variables)
}

function create_and_send_message_mutation(access_token: string, body: string, receiverId: number) {
  let query = `
    mutation createAndSendMessage($input: MessageInput!) {
      createAndSendMessage(input: $input) {
        message {
          id
          body
          receiver {
            id
            name
          }
        }
        errors {
          key
          message
        }
      }
    }
  `;

  let input = { body, receiverId }
  let variables = { input }

  return post_gql(query, access_token, variables)
}

function get_message_by_id_query(access_token: string, id: number) {
  let query = `
    query message {
      message(id: "${id}") {
        message {
          id
          body
          receiver {
            id
            name
          }
          tags {
            label
          }
        }
      }
    }
  `;

  return post_gql(query, access_token, {})
}

function inbound_message(message_body: string, contact_name: string) {

  let message_request_params = {
    "app": "GLIFICAPP",
    "timestamp": 1580227766370,
    "version": 2,
    "type": "message",
    "payload": {
      "type": "text",
      "id": "ABEGkYaYVSEEAhAL3SLAWwHKeKrt6s3FKB0c",
      "source": CONTACTPHONE,
      "payload": {
        "text": message_body
      },
      "sender": {
        "phone": CONTACTPHONE,
        "name": contact_name,
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