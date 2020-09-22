import { check } from 'k6';
import { Options } from 'k6/options';

import {
  sleep_delay
} from '../helpers';

import {
  inbound_message,
  search_query,
  setup as setup_flow
} from './flow_helpers';


export let options: Options = {
    vus: 10,
    iterations: 20
};

export const setup = () => setup_flow()

export default function (data: any) {
  let access_token = data.access_token;
  let contacts = data.contacts;
  let contact_index = __VU - 1

  test_help_flow_with_wrong_input(access_token, contacts[contact_index])
}

function test_help_flow_with_wrong_input(access_token: string, contact: any) {
  let flow_keyword = "help"
  inbound_message(flow_keyword, contact)
  sleep_delay()

  let res = search_query(access_token, contact);
  let first_flow_message = res.search[0].messages[0].body;
  check(res, {
    'sent first flow message successfully': () =>
      res.search[0].messages[0].body !== flow_keyword
  });

  inbound_message("Wrong input", contact)
  sleep_delay()
  
  let new_res = search_query(access_token, contact);
  check(new_res, {
    'sent first flow message for 1st wrong input': () =>
      new_res.search[0].messages[0].body === first_flow_message
  });

  inbound_message("Wrong input 2", contact)
  sleep_delay()

  new_res = search_query(access_token, contact);
  check(new_res, {
      'sent first flow message for 2nd wrong input': () =>
      new_res.search[0].messages[0].body === first_flow_message
  });

  inbound_message("Wrong input 3", contact)
  sleep_delay()

  new_res = search_query(access_token, contact);
  check(new_res, {
      'sent first flow message for 3rd wrong input': () =>
      new_res.search[0].messages[0].body === first_flow_message
  });

  inbound_message("Wrong input 4", contact)
  sleep_delay()

  new_res = search_query(access_token, contact);
  check(new_res, {
      'No response is sent for 4th wrong input': () =>
      new_res.search[0].messages[0].body === "Wrong input 4"
  });
}