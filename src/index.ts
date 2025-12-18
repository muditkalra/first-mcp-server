import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";



// Create server instance
const server = new McpServer({
    name: "first-mcp",
    version: "1.0.0",
});

server.registerTool("add_two_number", {
    description: "add two numbers", inputSchema: {
        a: z.number().describe("first number"),
        b: z.number().describe("second number")
    }
}, ({ a, b }) => {
    return {
        content: [{ type: "text", text: `Sum of two number is ${a + b}` }]
    }
});


server.registerTool("get_github_repos",
    {
        description: "Get Github repositories from the given username",
        inputSchema: {
            username: z.string().describe("Github username")
        }
    },
    async ({ username }) => {

        const res = await fetch(`https://api.github.com/users/${username}/repos`, {
            headers: { "User-Agent": "MCP_Server" },
        });

        if (!res.ok) {
            throw new Error("Githb Api error");
        }

        const repos = await res.json();

        const repoList = repos.map((repo: any, i: number) => `${i + 1}. ${repo.name}`).join("\n\n");

        return {
            content: [{ type: "text", text: `Github Repositories for ${username}: (${repos.length} repos) \n\n ${repoList}` }]
        }
    }
);

// resource (data-source);

server.registerResource("society_rules", "rules://all",
    {
        description: "Resource for all society rules",
        mimeType: "application/json"
    },
    async (uri) => {
        const uriString = uri.toJSON();
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const rules = await readFile(path.resolve(__dirname, "../src/data/rules.json"), { encoding: "utf-8" });
        return {
            contents: [{
                uri: uriString,
                mimeType: "application/json",
                text: rules
            }]
        }
    }
)

//prompt;


server.registerPrompt("explain_sql", {
    title: "Sql Query explainer",
    description: "explain the given sql query",
    argsSchema: {
        sql: z.string().describe("The sql query to explain")
    }
}, ({ sql }) => {
    return {
        messages: [{
            role: "user",
            content: {
                type: "text",
                text: `Give me a detailed explanation of the following SQL query in plain English:${sql} Make it very detailed and specific for a beginner to understand`
            }
        }]
    }
})


async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Adding two number mcp server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});