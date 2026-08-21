export const advisoriesValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      '_id',
      'advisoryId',
      'beachId',
      'advisoryType',
      'advisoryCause',
      'advisoryDuration',
      'advisoryStartDate',
      'advisoryStartTime',
      'advisoryEndDate',
      'advisoryEndTime'
    ],
    additionalProperties: false,
    properties: {
        _id: {
        bsonType: 'objectId',
        description: 'MongoDB-generated advisory identifier.'
        },
        advisoryId: {
        bsonType: 'int',
        minLength: 1,
        description: 'Unique advisory identifier from the CA beach water quality dataset.'
        },
        beachId: {
        bsonType: 'int',
        minLength: 1,
        description: 'Unique beach identifier from the CA beach water quality dataset specifiying the affected beach.'
        },
        advisoryType: {
        bsonType: ['string', 'null'],
        minLength: 1,
        description: 'The type of the advisory put on the effected beach: Closure, Posting, Rain or null.'
        },
        advisoryCause: {
        bsonType: ['string', 'null'],
        minLength: 0,
        description: 'A description for the reason behind the advisory being created.'
        },
        advisoryDuration: {
        bsonType: ['int', 'null'],
        minLength: 1,
        description: 'A duration in days, calculated using the difference between the advisoryStartDate and advisoryEndDate'
        },
        advisoryStartDate: {
        bsonType: ['string'],
        minLength: 1,
        description: 'The starting date for when the advisory is created and in effect'
        },
        advisoryStartTime: {
        bsonType: ['string'],
        minLength: 1,
        description: 'The time portion of the advisoryStartDate for when the advisory is created and in effect'
        },
        advisoryEndDate: {
        bsonType: ['string', 'null'],
        minLength: 1,
        description: 'The ending date for when the advisory is closed and no longer in effect'
        },
        advisoryEndTime: {
        bsonType: ['string', 'null'],
        minLength: 1,
        description: 'The time portion of the advisoryEndDate for when the advisory is closed and no longer in effect'
        }
    }
  }
};

export const advisoriesIndexes = [
  {
    key: { advisoryId: 1 },
    name: 'advisories_advisoryId_unique',
    unique: true
  }
];
