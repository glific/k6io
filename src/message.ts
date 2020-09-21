import http from "k6/http";
import { check } from 'k6';
import { Options } from 'k6/options';

import {
  sleep_delay,
  post_gql,
  setup as setup_helper
} from './helpers';

const BASE_URL = 'http://glific.test:4000';
const CONTACTPHONE = `918971506190`

export let options: Options = {
  // vus: 10,
  // duration: '1s',
};

export const setup = () => setup_helper()

export default function (access_token: string) {
  let contacts_query_response = contacts_query(access_token);
  let contact = contacts_query_response.contacts[0]

  let message_mutation_response = create_and_send_message_mutation(access_token, "new message", contact);
  check(message_mutation_response, {
    'stored outbound message successfully': () =>
      message_mutation_response.createAndSendMessage.message.body === "new message"
  });
  sleep_delay()

  let message_query_response = get_message_by_id_query(access_token, message_mutation_response.createAndSendMessage.message.id);
  check(message_query_response, {
    'retrieved stored outbound message successfully': () =>
      message_query_response.message.message.body == message_mutation_response.createAndSendMessage.message.body,
  });

  let res = inbound_message("test_message", contact)
  check(res, {
    'stored inbound message successfully': () =>
      res.status === 200
  });
  sleep_delay()

  let search_query_response = search_query(access_token, contact);
  check(search_query_response, {
    'retrieved stored inbound message successfully': () =>
      search_query_response.search[0].messages[0].body === "test_message",
    'tagged inbound message with Not replied': () =>
      search_query_response.search[0].messages[0].tags[0].label === "Not replied"
  });
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

  let filter = { phone: CONTACTPHONE }
  let variables = { filter }

  return post_gql(query, access_token, variables)
}

function create_and_send_message_mutation(access_token: string, body: string, contact: any) : any {
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

  let input = { body, receiverId : contact.id }
  let variables = { input }

  return post_gql(query, access_token, variables)
}

function get_message_by_id_query(access_token: string, id: number) : any {
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

function inbound_message(message_body: string, contact: any) : any {

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

function search_query(access_token: string, contact: any) : any {
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