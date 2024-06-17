/**
 * @generated SignedSource<<cdd895d77dfcaa8a1f91887d2aff5dd8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type ExperimentCompareTableQuery$variables = {
  datasetId: string;
  experimentIds: ReadonlyArray<string>;
};
export type ExperimentCompareTableQuery$data = {
  readonly comparisons: ReadonlyArray<{
    readonly example: {
      readonly id: string;
      readonly revision: {
        readonly input: any;
        readonly referenceOutput: any;
      };
    };
    readonly runComparisonItems: ReadonlyArray<{
      readonly experimentId: string;
      readonly runs: ReadonlyArray<{
        readonly annotations: {
          readonly edges: ReadonlyArray<{
            readonly annotation: {
              readonly explanation: string | null;
              readonly id: string;
              readonly label: string | null;
              readonly name: string;
              readonly score: number | null;
            };
          }>;
        };
        readonly endTime: string;
        readonly error: string | null;
        readonly output: any | null;
        readonly startTime: string;
      }>;
    }>;
  }>;
  readonly dataset: {
    readonly experiments?: {
      readonly edges: ReadonlyArray<{
        readonly experiment: {
          readonly id: string;
          readonly name: string;
          readonly sequenceNumber: number;
        };
      }>;
    };
    readonly id: string;
  };
};
export type ExperimentCompareTableQuery = {
  response: ExperimentCompareTableQuery$data;
  variables: ExperimentCompareTableQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "datasetId"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "experimentIds"
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v4 = {
  "alias": "comparisons",
  "args": [
    {
      "kind": "Variable",
      "name": "experimentIds",
      "variableName": "experimentIds"
    }
  ],
  "concreteType": "ExperimentComparison",
  "kind": "LinkedField",
  "name": "compareExperiments",
  "plural": true,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "DatasetExample",
      "kind": "LinkedField",
      "name": "example",
      "plural": false,
      "selections": [
        (v2/*: any*/),
        {
          "alias": null,
          "args": null,
          "concreteType": "DatasetExampleRevision",
          "kind": "LinkedField",
          "name": "revision",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "input",
              "storageKey": null
            },
            {
              "alias": "referenceOutput",
              "args": null,
              "kind": "ScalarField",
              "name": "output",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "RunComparisonItem",
      "kind": "LinkedField",
      "name": "runComparisonItems",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "experimentId",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "ExperimentRun",
          "kind": "LinkedField",
          "name": "runs",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "output",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "error",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "startTime",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "endTime",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "concreteType": "ExperimentRunAnnotationConnection",
              "kind": "LinkedField",
              "name": "annotations",
              "plural": false,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "ExperimentRunAnnotationEdge",
                  "kind": "LinkedField",
                  "name": "edges",
                  "plural": true,
                  "selections": [
                    {
                      "alias": "annotation",
                      "args": null,
                      "concreteType": "ExperimentRunAnnotation",
                      "kind": "LinkedField",
                      "name": "node",
                      "plural": false,
                      "selections": [
                        (v2/*: any*/),
                        (v3/*: any*/),
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "score",
                          "storageKey": null
                        },
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "label",
                          "storageKey": null
                        },
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "explanation",
                          "storageKey": null
                        }
                      ],
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                }
              ],
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v5 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "datasetId"
  }
],
v6 = {
  "kind": "InlineFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "ExperimentConnection",
      "kind": "LinkedField",
      "name": "experiments",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "ExperimentEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": "experiment",
              "args": null,
              "concreteType": "Experiment",
              "kind": "LinkedField",
              "name": "node",
              "plural": false,
              "selections": [
                (v2/*: any*/),
                (v3/*: any*/),
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "sequenceNumber",
                  "storageKey": null
                }
              ],
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Dataset",
  "abstractKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ExperimentCompareTableQuery",
    "selections": [
      (v4/*: any*/),
      {
        "alias": "dataset",
        "args": (v5/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v6/*: any*/)
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "ExperimentCompareTableQuery",
    "selections": [
      (v4/*: any*/),
      {
        "alias": "dataset",
        "args": (v5/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "__typename",
            "storageKey": null
          },
          (v2/*: any*/),
          (v6/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "be90b60e21a7e4ccb0f4b4a44c1c685a",
    "id": null,
    "metadata": {},
    "name": "ExperimentCompareTableQuery",
    "operationKind": "query",
    "text": "query ExperimentCompareTableQuery(\n  $experimentIds: [GlobalID!]!\n  $datasetId: GlobalID!\n) {\n  comparisons: compareExperiments(experimentIds: $experimentIds) {\n    example {\n      id\n      revision {\n        input\n        referenceOutput: output\n      }\n    }\n    runComparisonItems {\n      experimentId\n      runs {\n        output\n        error\n        startTime\n        endTime\n        annotations {\n          edges {\n            annotation: node {\n              id\n              name\n              score\n              label\n              explanation\n            }\n          }\n        }\n      }\n    }\n  }\n  dataset: node(id: $datasetId) {\n    __typename\n    id\n    ... on Dataset {\n      experiments {\n        edges {\n          experiment: node {\n            id\n            name\n            sequenceNumber\n          }\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "cd53fbb62b69987f05f540493e6fea8d";

export default node;