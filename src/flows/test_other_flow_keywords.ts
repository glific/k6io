import { check } from 'k6';
import { Options } from 'k6/options';

import {
  sleep_delay
} from '../helpers';

import {
  inbound_message,
  count_messages_query,
  search_query,
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

  test_new_contact_with_other_flow_keywords(access_token, contacts[contact_index])
}

function test_new_contact_with_other_flow_keywords(access_token: string, contact: any) {
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

  flow_keyword = "help"
  inbound_message(flow_keyword, contact)
  sleep_delay()

  res = search_query(access_token, contact);
  check(res, {
    'received help keyword and sent message for help flow': () => {
      let flow_message_en = `Thank you for reaching out. Is this what you're looking for-\n      \nType 1 to know more about Glific,\nType 2 if you'd like to be onboarded to Glific\nType 3 to goto the Glific WebSite\nType 4 to optout`
      let flow_message_hi = `बाहर तक पहुँचने के लिए धन्यवाद। क्या यह आप के लिए देख रहे हैं- टाइप 1, ग्लिफ़ टाइप 2 के बारे में अधिक जानने के लिए, यदि आप ग्लिफ़ टाइप 3 के लिए शानदार वेबसीइट टाइप 4 से आउटपुट के लिए ऑनबोर्ड होना चाहते हैं`
      return res.search[0].messages[0].body === flow_message_en
    }
  });

  inbound_message("1", contact)
  sleep_delay()
}