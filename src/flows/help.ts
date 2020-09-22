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

  test_help_flow(access_token, contacts[contact_index])
}

function test_help_flow(access_token: string, contact: any) {
  let flow_keyword = "help"
  let response = inbound_message(flow_keyword, contact)
  sleep_delay()

  let search_query_response = search_query(access_token, contact);
  check(search_query_response, {
    'sent first flow message successfully': () =>
      search_query_response.search[0].messages[0].body !== flow_keyword
  });

  response = inbound_message("2", contact)
  sleep_delay()

  search_query_response = search_query(access_token, contact);
  check(search_query_response, {
      'sent second flow message successfully': () =>
      search_query_response.search[0].messages[0].body !== "2"
  });
}