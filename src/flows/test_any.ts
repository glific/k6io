import { Options } from 'k6/options';
import { group } from 'k6';

import {
  getRandomInteger,
  setup as setup_flow
} from './flow_helpers';

import help_flow from './help';
import new_contact_flow from './new_contact';
import test_wrong_input from './test_wrong_input';
import test_other_flow_keywords from "./test_other_flow_keywords";

export let options: Options = {
    vus: 10,
    iterations: 20
};

export const setup = () => setup_flow()

export default function (data: any) {
  let random_index = getRandomInteger(0,3)

  switch (random_index) {
    case 1:
      group('help flow', function () {
        help_flow(data);
      });
      break;
    case 2:
      group('new contact flow', function () {
        new_contact_flow(data);
      });
      break;
    case 3:
      group('wrong input', function () {
        test_wrong_input(data);
      });
      break;
    case 4:
      group("input other flow's keyword", function () {
        test_other_flow_keywords(data);
      });
    break;
  }
}