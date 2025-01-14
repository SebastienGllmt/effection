import type { JSXElement } from "revolution";
import type { Docs } from "../docs/docs.ts";
import type { DocMeta } from "../docs/docs.ts";

import { useAppHtml } from "./app.html.tsx";

import { respondNotFound, useParams } from "revolution";

import { Rehype } from "../components/rehype.tsx";
import { Transform } from "../components/transform.tsx";

import rehypeSlug from "npm:rehype-slug@5.1.0";
import rehypeAutolinkHeadings from "npm:rehype-autolink-headings@6.1.1";
import rehypeAddClasses from "npm:rehype-add-classes@1.0.0";
import rehypeToc from "npm:@jsdevtools/rehype-toc@3.0.2";
import { IconGithub } from "../components/icons/github.tsx";
import { IconDiscord } from "../components/icons/discord.tsx";
import { ProjectSelect } from "../components/project-select.tsx";
import { Navburger } from "../components/navburger.tsx";
import { SitemapRoute, RoutePath } from "../plugins/sitemap.ts";

export function docsRoute(docs: Docs): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      let paths: RoutePath[] = [];
      for (let doc of yield* docs.all()) {
        paths.push({
          pathname: pathname({ id: doc.id }),
        });
      }
      return paths;
    },
    *handler() {
      let { id } = yield* useParams<{ id: string }>();

      const doc = yield* docs.getDoc(id);

      if (!doc) {
        return yield* respondNotFound();
      }

      let { topics } = doc;

      let AppHtml = yield* useAppHtml({ title: `${doc.title} | Effection` });

      return (
        <AppHtml
          navLinks={[
            <a href="/docs/installation">Guides</a>,
            <a href="https://deno.land/x/effection/mod.ts">API</a>,
            <a
              class="flex flex-row"
              href="https://github.com/thefrontside/effection"
            >
              <span class="pr-1 md:inline-flex">
                <IconGithub />
              </span>
              <span class="hidden md:inline-flex">
                Github
              </span>
            </a>,
            <a class="flex flex-row" href="https://discord.gg/r6AvtnU">
              <span class="pr-1 md:inline-flex">
                <IconDiscord />
              </span>
              <span class="hidden md:inline-flex">Discord</span>
            </a>,
            <ProjectSelect classnames="sm:hidden shrink-0" />,
            <>
              <p class="flex flex-row md:hidden">
                <label class="cursor-pointer" for="nav-toggle">
                  <Navburger />
                </label>
              </p>
              <style media="all">
                {`
      #nav-toggle:checked ~ aside#docbar {
	display: none;
      }
	  `}
              </style>
            </>,
          ]}
        >
          <section class="min-h-0 mx-auto w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
            <input class="hidden" id="nav-toggle" type="checkbox" checked />
            <aside
              id="docbar"
              class="fixed top-0 h-full w-full grid grid-cols-2 md:hidden"
            >
              <nav class="bg-white p-2 border-r-2 h-full pt-24 min-h-0 h-full overflow-auto">
                {topics.map((topic) => (
                  <hgroup class="mb-2">
                    <h3 class="text-lg">{topic.name}</h3>
                    <menu class="text-gray-700">
                      {topic.items.map((item) => (
                        <li class="mt-1">
                          {doc.id !== item.id
                            ? (
                              <a
                                class="rounded px-4 block w-full py-2 hover:bg-gray-100"
                                href={`/docs/${item.id}`}
                              >
                                {item.title}
                              </a>
                            )
                            : (
                              <a class="rounded px-4 block w-full py-2 bg-gray-100 cursor-default">
                                {item.title}
                              </a>
                            )}
                        </li>
                      ))}
                    </menu>
                  </hgroup>
                ))}
              </nav>
              <label
                for="nav-toggle"
                class="h-full w-full bg-gray-500 opacity-50"
              />
            </aside>
            <aside class="min-h-0 overflow-auto hidden md:block pt-2 top-24 sticky h-fit">
              <nav class="pl-4">
                {topics.map((topic) => (
                  <hgroup class="mb-2">
                    <h3 class="text-lg">{topic.name}</h3>
                    <menu class="text-gray-700">
                      {topic.items.map((item) => (
                        <li class="mt-1">
                          {doc.id !== item.id
                            ? (
                              <a
                                class="rounded px-4 block w-full py-2 hover:bg-gray-100"
                                href={`/docs/${item.id}`}
                              >
                                {item.title}
                              </a>
                            )
                            : (
                              <a class="rounded px-4 block w-full py-2 bg-gray-100 cursor-default">
                                {item.title}
                              </a>
                            )}
                        </li>
                      ))}
                    </menu>
                  </hgroup>
                ))}
              </nav>
            </aside>
            <Transform fn={liftTOC}>
              <article class="prose max-w-full px-6 py-2">
                <h1>{doc.title}</h1>
                <Rehype
                  plugins={[
                    rehypeSlug,
                    [rehypeAutolinkHeadings, {
                      behavior: "append",
                      properties: {
                        className:
                          "opacity-0 group-hover:opacity-100 after:content-['#'] after:ml-1.5",
                      },
                    }],
                    [rehypeAddClasses, {
                      "h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]": "group",
                      "pre": "grid",
                    }],
                    [rehypeToc, {
                      cssClasses: {
                        toc:
                          "hidden text-sm font-light tracking-wide leading-loose lg:block relative pt-2",
                        list: "fixed w-[200px]",
                        link: "hover:underline hover:underline-offset-2",
                      },
                    }],
                  ]}
                >
                  <doc.MDXContent />
                </Rehype>
                <NextPrevLinks doc={doc} />
              </article>
            </Transform>
          </section>
        </AppHtml>
      );
    },
  };
}

function NextPrevLinks({ doc }: { doc: DocMeta }): JSX.Element {
  let { next, prev } = doc;
  return (
    <menu class="grid grid-cols-2 my-10 gap-x-2 xl:gap-x-20 2xl:gap-x-40 text-lg">
      {prev
        ? (
          <li class="col-start-1 text-left font-light border-1 rounded-lg p-4">
            Previous
            <a
              class="py-2 block text-xl font-bold text-blue-primary no-underline tracking-wide leading-5 before:content-['«&nbsp;'] before:font-normal"
              href={`/docs/${prev.id}`}
            >
              {prev.title}
            </a>
          </li>
        )
        : <li />}
      {next
        ? (
          <li class="col-start-2 text-right font-light border-1 rounded-lg p-4">
            Next
            <a
              class="py-2 block text-xl font-bold text-blue-primary no-underline tracking-wide leading-5 after:content-['&nbsp;»'] after:font-normal"
              href={`/docs/${next.id}`}
            >
              {next.title}
            </a>
          </li>
        )
        : <li />}
    </menu>
  );
}

/**
 * Lift the table of contents for the guide so that it is a peer
 * of the article, not contained within it.
 */
function liftTOC(element: JSX.Element): JSX.Element {
  if (element.type !== "element") {
    return element;
  }
  let nav = element.children.find((child) =>
    child.type === "element" && child.tagName === "nav"
  );
  if (!nav) {
    return element;
  }
  return {
    type: "root",
    children: [
      {
        ...element,
        children: element.children.filter((child) => child !== nav),
      },
      nav,
    ],
  };
}

function customizeTOC(toc: HtmlElementNode) {
  const [list, ...rest] = toc?.children as HtmlElementNode[];
  const modified = addPaddingToChildren({
    ...toc,
    children: [
      {
        ...list,
        properties: {
          className: `fixed w-[250px] ${list.properties.className}`,
        },
        children: [
          {
            type: "element",
            tagName: "li",
            properties: {
              className: '',
            },
            children: [
              {
                type: "element",
                tagName: "h2",
                properties: {
                  className: "text-lg",
                },
                children: [
                  {
                    type: "text",
                    value: "On this page",
                  } as unknown as HtmlElementNode,
                ],
              } as unknown as HtmlElementNode,
            ],
          } as unknown as HtmlElementNode,
          ...(list.children ?? []),
        ],
      },
      ...rest,
    ],
  });

  return modified;
}

function addPaddingToChildren(
  node: HtmlElementNode & { children: HtmlElementNode[] },
): HtmlElementNode {
  if (node.children) {
    return {
      ...node,
      properties: {
        ...node.properties,
        className: isNestedHeader(node)
          ? `pl-5 ${node.properties.className}`
          : node.properties.className,
      },
      children:
        (node.children as (HtmlElementNode & { children: HtmlElementNode[] })[])
          .map((child) => addPaddingToChildren(child)),
    };
  } else {
    return node;
  }
}

function isNestedHeader(node: HtmlElementNode) {
  if (node.tagName === "li") {
    const { data } = node;
    if (data && Object.hasOwn(data, "hookArgs")) {
      const { hookArgs } = data as { hookArgs: HtmlElementNode[] };
      return ["h3", "h4", "h5", "h6"].includes(hookArgs[0].tagName);
    }
  }
  return false;
}
