type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type Operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

/**
 * This list of operations is used to generate the manual testing UI.
 */
const operations: Operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input", email: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { email: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update Password",
    endpoint: "/api/users/password",
    method: "PATCH",
    fields: { currentPassword: "input", newPassword: "input" },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "See all requests",
    endpoint: "/api/requests",
    method: "GET",
    fields: {},
  },
  {
    name: "Accept a request",
    endpoint: "/api/requests/accept/:id",
    method: "PATCH",
    fields: {
      id: "input"
    }
  },
  {
    name: "Decline a request",
    endpoint: "/api/requests/decline/:id",
    method: "PATCH",
    fields: {
      id: "input"
    }
  },
  {
    name: "Withdraw request",
    endpoint: "/api/requests/:id",
    method: "DELETE",
    fields: {
      id: "input",
    }
  },
  {
    name: "Get locations (empty for all)",
    endpoint: "/api/locations",
    method: "GET",
    fields: { city: "input", state: "input" }
  },
  {
    name: "Tag a new location",
    endpoint: "/api/locations",
    method: "POST",
    fields: { name: "input", street: "input", city: "input", state: "input", zipcode: "input", latitude: "input", longitude: "input" }
  },
  {
    name: "Delete a location",
    endpoint: "/api/locations/:id",
    method: "DELETE",
    fields: { id: "input" }
  },
  {
    name: "See all groups",
    endpoint: "/api/groups",
    method: "GET",
    fields: {}
  },
  {
    name: "Create group",
    endpoint: "/api/groups",
    method: "POST",
    fields: { name: "input", capacity: "input", privacy: "input", location: "input" }
  },
  {
    name: "Rename group",
    endpoint: "/api/groups/:id",
    method: "POST",
    fields: { id: "input", name: "input" }
  },
  {
    name: "Request to join group",
    endpoint: "/api/requests/group/:id",
    method: "POST",
    fields: { id: "input", message: "textarea" }
  },
  {
    name: "Accept group request",
    endpoint: "/api/requests/accept/:requestId",
    method: "PUT",
    fields: { requestId: "input" }
  },
  {
    name: "Decline group request",
    endpoint: "/api/requests/decline/:requestId",
    method: "PUT",
    fields: { requestId: "input" }
  },
  {
    name: "Withdraw group request",
    endpoint: "/api/requests/:requestId",
    method: "PUT",
    fields: { requestId: "input" }
  },
  {
    name: "Delete group",
    endpoint: "/api/groups/:id",
    method: "DELETE",
    fields: { id: "input", }
  },
  {
    name: "See all events",
    endpoint: "/api/events",
    method: "GET",
    fields: {},
  },
  {
    name: "See upcoming events",
    endpoint: "/api/events/upcoming",
    method: "GET",
    fields: {},
  },
  {
    name: "See past events",
    endpoint: "/api/events/past",
    method: "GET",
    fields: {},
  },
  {
    name: "Search events by name",
    endpoint: "/api/events/name",
    method: "GET",
    fields: { name: "input" },
  },
  {
    name: "Create new event (time format: MM/DD/YYYY TT:TT AM)",
    endpoint: "/api/events",
    method: "POST",
    fields: { name: "input", group: "input", start: "input", end: "input", capacity: "input", location: "input" }
  },
  {
    name: "Register to attend event",
    endpoint: "/api/events/register/:id",
    method: "PUT",
    fields: { id: "input" }
  },
  {
    name: "Unregister from event",
    endpoint: "/api/events/unregister/:id",
    method: "PUT",
    fields: { id: "input" }
  },
  {
    name: "Delete event",
    endpoint: "/api/events/:id",
    method: "DELETE",
    fields: { id: "input" }
  },
  {
    name: "Get friends",
    endpoint: "/api/friends",
    method: "GET",
    fields: {}
  },
  {
    name: "Get friend requests",
    endpoint: "/api/friends/requests",
    method: "GET",
    fields: {}
  },
  {
    name: "Send new friend request",
    endpoint: "/api/requests/friend/:id",
    method: "POST",
    fields: { id: "input", message: "input" }
  },
  {
    name: "Accept friend request",
    endpoint: "/api/requests/accept/:requestId",
    method: "PUT",
    fields: { requestId: "input" }
  },
  {
    name: "Reject friend request",
    endpoint: "/api/requests/decline/:requestId",
    method: "PUT",
    fields: { requestId: "input" }
  }
];

/*
 * You should not need to edit below.
 * Please ask if you have questions about what this test code is doing!
 */

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      const htmlTag = tag === "json" ? "textarea" : tag;
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${htmlTag} name="${prefix}${name}"></${htmlTag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const op = operations.find((op) => op.endpoint === $endpoint && op.method === $method);
  const pairs = Object.entries(reqData);
  for (const [key, val] of pairs) {
    if (val === "") {
      delete reqData[key];
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type = key.split(".").reduce((obj, key) => obj[key], op?.fields as any);
    if (type === "json") {
      reqData[key] = JSON.parse(val as string);
    }
  }

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
