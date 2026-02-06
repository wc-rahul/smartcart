import { authenticate } from "../shopify.server";
import { useLoaderData } from "react-router";

export const loader = async ({ request }) => {
  // Use the authentication API from the React Router template
  console.log('RRRRRAAAAAAAHHHHHHHUUUUUULLLLLLL',request)
  const {storefront, liquid} = await authenticate.public.appProxy(request);

  // // Read URL parameters added by Shopify when proxying
  // const url = new URL(request.url);

  // return {
  //   shop: url.searchParams.get("shop"),
  //   loggedInCustomerId: url.searchParams.get("logged_in_customer_id"),
  // };
  if (!storefront) {
    return new Response();
  }

  const response = await storefront.graphql(
    `#graphql
    query productTitle {
      products(first: 1) {
        nodes {
          title
        }
      }
    }`,
  );
  const body = await response.json();

  const title = body.data.products.nodes[0].title;

  return liquid(`Found product ${title} from {{shop.name}}`);
  
};

export default function MyAppProxy() {
  const loaderdata = useLoaderData();

  return <div>{loaderdata}</div>;
}