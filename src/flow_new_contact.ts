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
  vus: 5,
  iterations: 5
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
  let contact_index = __VU - 1

  test_new_contact_flow(access_token, contacts[contact_index])
}

function test_new_contact_flow(access_token: string, contact: any) {
  let res = count_messages_query(access_token, contact);
  let contact_messages_count = res.countMessages

  let flow_keyword = "newcontact"
  inbound_message(flow_keyword, contact)
  sleep_delay()

  res = count_messages_query(access_token, contact);
  check(res, {
    'sent newcontact flow messages': () =>
      res.countMessages == contact_messages_count + 3
  });

  inbound_message("2", contact)
  sleep_delay()

  res = count_messages_query(access_token, contact);
  check(res, {
    'received response and sent registration flow message for full name': () =>
      res.countMessages == contact_messages_count + 6
  });

  inbound_message(contact.name, contact)
  sleep_delay()

  res = count_messages_query(access_token, contact);
  check(res, {
    'received response and sent registration flow message for age group': () =>
      res.countMessages == contact_messages_count + 8
  });

  inbound_message("4", contact)
  sleep_delay()

  res = count_messages_query(access_token, contact);
  check(res, {
    'received response and sent message for sol activity': () =>
      res.countMessages == contact_messages_count + 11
  });

  inbound_message("9", contact)
  sleep_delay()

  res = count_messages_query(access_token, contact);
  check(res, {
    'received response and sent message for help flow': () =>
      res.countMessages == contact_messages_count + 13
  });

  inbound_message("2", contact)
  sleep_delay()

  res = count_messages_query(access_token, contact);
  check(res, {
    'received response and sent second message for help flow successfully': () =>
      res.countMessages == contact_messages_count + 15
  });

  inbound_message("Hi, is this flow complete now?", contact)
  sleep_delay()

  res = count_messages_query(access_token, contact);
  check(res, {
    'Flow is completed and no message is sent': () =>
      res.countMessages == contact_messages_count + 16
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

  let filter = { providerStatus: "SESSION_AND_HSM" }
  let variables = { filter }

  return post_gql(query, access_token, variables)
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

function count_messages_query(access_token: string, contact: any) : any {
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
