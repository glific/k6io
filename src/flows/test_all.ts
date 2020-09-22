import { Options } from 'k6/options';

import {
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
  help_flow(data);
  new_contact_flow(data);
  test_wrong_input(data);
  test_other_flow_keywords(data);
}
