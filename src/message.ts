import http from "k6/http";
import { check, group, sleep } from 'k6';
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
  let contact = contacts[contact_index]

  group('Inbound message', function () {
    let res = inbound_message("test_message", contact)
    check(res, {
      'stored inbound message successfully': () =>
        res.status === 200
    });
    sleep_delay()

    res = search_query(access_token, contact);
    check(res, {
      'retrieved stored inbound message successfully': () =>
        res.search[0].messages[0].body === "test_message",
      'tagged inbound message with Not replied': () =>
        res.search[0].messages[0].tags[0].label === "Not replied"
    });
  });

  group('Outbound message', function () {
    let res = create_and_send_message_mutation(access_token, "new message", contact);
    check(res, {
      'stored outbound message successfully': () =>
        res.createAndSendMessage.message.body === "new message"
    });
    sleep_delay()

    let res_2 = get_message_by_id_query(access_token, res.createAndSendMessage.message.id);
    check(res_2, {
      'retrieved stored outbound message successfully': () =>
        res_2.message.message.body == res.createAndSendMessage.message.body,
    });
  });
}

function contacts_query(access_token: string) : any {
  let query = `
    query contacts($filter: ContactFilter) {
      contacts(filter: $filter) {
        id
        name
        phone
        lastMessageAt
      }
    }
  `;

  let filter = { providerStatus: "SESSION_AND_HSM" }
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

export function getRandomInteger(min: number, max: number) : number {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}