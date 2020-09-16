import { sleep, check } from 'k6';
import { Options } from 'k6/options';

import {
  post_gql,
  setup as setup_helper
} from './helpers';


var accessToken: string | null = "";

export let options:Options = {
    vus: 10,
    duration: '1s',
};


function tags_query(access_token:string) {
    let query =  `
      query tags {
        tags {
          id
          label
        }
      }
    `;
  
  post_gql(query, access_token, {});
}

function tags_create_query(access_token) {
  let query = `
   mutation creTag($input: TagInput!) {
    createTag(input: $input) {
      tag {
        id
        description
        label
        colorCode
        parent {
          id
        }
      }
      errors {
        key
        message
      }
    }
  }  
  `;

  let uniq = Math.random().toString(36).substr(2, 9);
  let label = "newlabel" + uniq;
  let shortcode = (label + uniq).toLowerCase();
  let languageID = 2
  let input = { label, shortcode, languageID }
  let variables = { input }
  
  return post_gql(query, access_token, variables);
}

function tags_delete_query() {
    return `
      mutation deleteTag {
        deleteTag(id: $id) {
          tag {
            id
          }
          errors {
            key
            message
          }
        }
      }
    `;
}

export const setup = () => setup_helper()

export default function (access_token: string) {
  tags_query(access_token)
  sleep(Math.random() * 3 + 1);
  let create_tag = tags_create_query(access_token)
  sleep(Math.random() * 3 + 1);
  post_gql(tags_delete_query(), access_token, { id: create_tag.createTag.tag.id})
  sleep(Math.random() * 3 + 1);
}
