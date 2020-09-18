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
  vus: 3,
  iterations: 3
};

export const setup = () => setup_helper()

export default function (access_token: string) {
  let contacts_query_response = contacts_query(access_token);
  let contacts = contacts_query_response.contacts
  let contact_index = __VU - 1

  let list_messages_query_response = list_messages_query(access_token, contacts[contact_index].phone);
  let contact_messages_count = list_messages_query_response.messages.length

  let flow_keyword = "newcontact"
  let response = inbound_message(flow_keyword, contacts[contact_index])
  check(response, {
    'received flow keyword newcontact': () =>
      response.status === 200
  });
  sleep_delay()

  list_messages_query_response = list_messages_query(access_token, contacts[contact_index].phone);
  check(list_messages_query_response, {
    'sent newcontact flow messages': () =>
      list_messages_query_response.messages.length == contact_messages_count + 3
  });

  response = inbound_message("2", contacts[contact_index])
  check(response, {
    'received language response message': () =>
      response.status === 200
  });
  sleep_delay()

  list_messages_query_response = list_messages_query(access_token, contacts[contact_index].phone);
  check(list_messages_query_response, {
    'sent registration flow message for full name': () =>
      list_messages_query_response.messages.length == contact_messages_count + 6
  });

  response = inbound_message(contacts[contact_index].name, contacts[contact_index])
  check(response, {
    'received response message for full name': () =>
      response.status === 200
  });
  sleep_delay()

  list_messages_query_response = list_messages_query(access_token, contacts[contact_index].phone);
  check(list_messages_query_response, {
    'sent registration flow message for age group': () =>
      list_messages_query_response.messages.length == contact_messages_count + 8
  });

  response = inbound_message("4", contacts[contact_index])
  check(response, {
    'received response message for age group': () =>
      response.status === 200
  });
  sleep_delay()

  list_messages_query_response = list_messages_query(access_token, contacts[contact_index].phone);
  check(list_messages_query_response, {
    'sent message for sol activity': () =>
      list_messages_query_response.messages.length == contact_messages_count + 11
  });

  response = inbound_message("9", contacts[contact_index])
  check(response, {
    'received help response message': () =>
      response.status === 200
  });
  sleep_delay()

  list_messages_query_response = list_messages_query(access_token, contacts[contact_index].phone);
  check(list_messages_query_response, {
    'sent message for help flow': () =>
      list_messages_query_response.messages.length == contact_messages_count + 13
  });

  response = inbound_message("2", contacts[contact_index])
  check(response, {
    'received help flow response message': () =>
      response.status === 200
  });
  sleep_delay()

  list_messages_query_response = list_messages_query(access_token, contacts[contact_index].phone);
  check(list_messages_query_response, {
    'sent second message for help flow successfully': () =>
      list_messages_query_response.messages.length == contact_messages_count + 15
  });

  response = inbound_message("Hi, is this flow complete now?", contacts[contact_index])
  check(response, {
    'received another message': () =>
      response.status === 200
  });
  sleep_delay()

  list_messages_query_response = list_messages_query(access_token, contacts[contact_index].phone);
  check(list_messages_query_response, {
    'No response is sent': () =>
      list_messages_query_response.messages.length == contact_messages_count + 16
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

function list_messages_query(access_token: string, contact_phone: string) {
  console.log(contact_phone)
  let query = `
    query messages($filter: MessageFilter, $opts: Opts) {
      messages(filter: $filter, opts:$opts) {
        id
        body
        contact {
          id,
          name
        }
      }
    }
  `;

  let filter = {
    either: `${contact_phone}`
  }

  let variables = { filter }

  return post_gql(query, access_token, variables);
}