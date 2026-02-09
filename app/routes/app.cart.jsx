import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    // Fetch themes
    const themeRes = await admin.graphql(`
    query {
      themes(first: 100) {
        nodes {
          id
          name
          role
        }
      }
    }
  `);

    const themeJson = await themeRes.json();
    const themes = themeJson?.data?.themes?.nodes || [];

    const mainTheme = themes.find((t) => t.role === "MAIN");
    if (!mainTheme) return { shop, appdisabled: null, cartDisabled: null };

    // Fetch settings_data.json
    const fileRes = await admin.graphql(`
    query {
      theme(id: "${mainTheme.id}") {
        files(filenames: ["config/settings_data.json"], first: 1) {
          nodes {
            body {
              ... on OnlineStoreThemeFileBodyText {
                content
              }
            }
          }
        }
      }
    }
  `);

    const fileJson = await fileRes.json();
    const rawContent =
        fileJson?.data?.theme?.files?.nodes[0]?.body?.content || null;

    if (!rawContent) return { shop, appdisabled: null, cartDisabled: null };

    // Clean & parse JSON
    const cleanedContent = rawContent.replace(/\/\*[\s\S]*?\*\//g, "");
    let settings;
    try {
        settings = JSON.parse(cleanedContent);
    } catch (e) {
        console.error("Invalid settings_data.json");
        return { shop, appdisabled: null, cartDisabled: null };
    }

    const blocks = Object.entries(settings.current?.blocks || {}).map(
        ([id, block]) => ({ id, block })
    );

    // Detect enabled/disabled blocks
    const smartcartEmbed = blocks.find((b) =>
        b.block.type.includes("/smartcart/blocks/smartcartui/")
    );
    const smartcartasset = blocks.find((b) =>
        b.block.type.includes("/smartcart/blocks/smartcartasset-embed/")
    );

    return {
        shop,
        appdisabled: smartcartEmbed?.block?.disabled ?? null,
        cartDisabled: smartcartasset?.block?.disabled ?? null,
        blocks,
        apiKey: process.env.SHOPIFY_API_KEY,
    };
};

export const action = async ({ request }) => {
    await authenticate.admin(request);
    return null;
};

export default function Cart() {
    const { shop, appdisabled, cartDisabled, blocks, apiKey } = useLoaderData();
    console.log(shop, appdisabled, cartDisabled, blocks);
    const fetcher = useFetcher();
    const shopify = useAppBridge();

    const [state, setState] = useState({
        status: 0,
        link: "",
    });

    const isLoading =
        ["loading", "submitting"].includes(fetcher.state) &&
        fetcher.formMethod === "POST";

    useEffect(() => {
        if (fetcher.data?.pixelID) {
            shopify.toast.show("Cart Connected");
        }

        let status = 2; // default (settings)
        let link = "";

        const appId = apiKey;
        if (appdisabled === false) {
            status = 2;
        }
        else if (appdisabled == true || !appdisabled) {
            status = 1;
            link = `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${appId}/smartcartui`;
        }
        setState({ status, link });
    }, [fetcher.data, appdisabled, cartDisabled, shopify, shop, apiKey]);

    return (
        <s-section>
            <s-box padding="base">
                {state.status < 2 ? (
                    <s-button variant="primary" loading={isLoading} href={state.link}>
                        {state.status === 1 ? "Enable App" : "Enable Cart"}
                    </s-button>
                ) : (
                    <s-button loading={isLoading}>Cart Settings</s-button>
                )}
            </s-box>
        </s-section>
    );
}
