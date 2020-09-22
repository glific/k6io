import { Options } from 'k6/options';
import { group } from 'k6';

import {
  setup as setup_flow
} from './flow_helpers';

import help_flow from './help';
import new_contact_flow from './new_contact';
import test_wrong_input from './test_wrong_input';
import test_other_flow_keywords from "./test_other_flow_keywords";

export let options: Options = {
    vus: 10,
    iterations: 20,
    thresholds: {
      'http_req_duration': ['p(95) < 400']  // threshold on a standard metric
    }
};

export const setup = () => setup_flow()

export default function (data: any) {
  group('help flow', function () {
    help_flow(data);
  });
  group('new contact flow', function () {
    new_contact_flow(data);
  });
  group('wrong input', function () {
    test_wrong_input(data);
  });
  group("input other flow's keyword", function () {
    test_other_flow_keywords(data);
  });
}
