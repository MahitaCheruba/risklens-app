import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    scenarios: i.entity({
      name: i.string(),
      description: i.string(),
      fixedCost: i.number(),
      sellingPrice: i.number(),
      demandDistributionType: i.string(),
      demandMean: i.number().optional(),
      demandStdDev: i.number().optional(),
      demandMin: i.number().optional(),
      demandMax: i.number().optional(),
      demandMode: i.number().optional(),
      variableCostDistributionType: i.string(),
      variableCostMin: i.number().optional(),
      variableCostMode: i.number().optional(),
      variableCostMax: i.number().optional(),
      numSimulations: i.number(),
      createdAt: i.date(),
      updatedAt: i.date(),
      expectedProfit: i.number().optional(),
      probabilityOfLoss: i.number().optional(),
      percentile5: i.number().optional(),
      percentile95: i.number().optional(),
    }),
  },
  links: {
    scenarioOwner: {
      forward: { on: "scenarios", has: "one", label: "owner", required: true },
      reverse: { on: "$users", has: "many", label: "scenarios" },
    },
  },
  rooms: {},
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
