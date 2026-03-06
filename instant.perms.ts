const rules = {
  scenarios: {
    allow: {
      view: "auth.id != null && auth.id == data.ref('owner.id')",
      create: "auth.id != null",
      update: "auth.id != null && auth.id == data.ref('owner.id')",
      delete: "auth.id != null && auth.id == data.ref('owner.id')",
    },
  },
  $users: {
    allow: {
      view: "auth.id == data.id",
    },
  },
};

export default rules;
