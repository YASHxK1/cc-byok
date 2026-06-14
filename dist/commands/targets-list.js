import { listTargets } from "../core/target-registry.js";
export async function runTargetsList(context) {
    const config = await context.config.read();
    context.output.log("Launch targets:");
    for (const { target, builtIn } of listTargets(config)) {
        const active = config.activeTarget === target.id ? " (active)" : "";
        context.output.log(`  ${target.name} [${target.id}]${active}\n    ${target.command} ${(target.defaultArgs ?? []).join(" ")}\n    ${target.envProfile} profile, ${builtIn ? "built-in" : "custom"}`);
    }
}
//# sourceMappingURL=targets-list.js.map