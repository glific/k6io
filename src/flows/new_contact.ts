import { check } from 'k6';
import { Options } from 'k6/options';

import {
  sleep_delay
} from '../helpers';

import {
  inbound_message,
  count_messages_query,
  setup as setup_flow
} from './flow_helpers';

export let options: Options = {
  vus: 5,
  iterations: 5
};

export const setup = () => setup_flow()

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