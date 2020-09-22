import { Options } from 'k6/options';

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
  const function_array = [
    help_flow,
    new_contact_flow,
    test_wrong_input,
    test_other_flow_keywords
  ]

  let random_index = getRandomInteger(0,3)

  function_array[random_index](data)
}
