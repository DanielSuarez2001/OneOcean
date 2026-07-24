import moment from 'moment';
import {ObjectId} from 'mongodb';
let exportedMethods = {
    checkId(id) {
        if (!id || id === undefined || id === null) 
        {
            throw 'ID Must Be Provided!';
        }
        if (typeof id !== 'string' || !Number.isNaN(+id))
        {
            throw 'Bad Request!';
        } 
        id = id.trim();
        if (id.length === 0)
        {
            throw 'Empty ID!';
        }
        if (!ObjectId.isValid(id))
        {
            throw 'Invalid ObjectID!';
        } 
        return id;
    },
    validateDatasetId(datasetId) {
        let datasetIdSanatized;
        if (!datasetId)
        {
            throw 'datasetId must be provided';
        }
        if (typeof datasetId !== 'number')
        {
            if (typeof datasetId === 'string')
            {
                datasetIdSanatized = +(datasetId.trim());
                if (Number.isNaN(datasetIdSanatized))
                {
                    throw 'if datasetId is a string it must be in number form';
                }
            }
            else
            {
                throw 'datasetId must be a number or string in number form';
            }
        }
        else 
        {
            datasetIdSanatized = datasetId;
        }
        if (datasetIdSanatized <= 0)
        {
            throw 'datasetId must be a number greater than 0';
        }
        return datasetIdSanatized;
    },
    createCommentObject(firstName, lastName, comment)
    {
        let commentObject = 
        {
            _id: null,
            name: null,
            postTime: null,
            comment: null
        }

        if (!firstName || !lastName || !comment)
        {
            throw 'firstName, lastName, and comment must be provided';
        }
        if (typeof firstName !== 'string' || typeof lastName !== 'string'|| typeof comment !== 'string')
        {
            throw 'firstName, lastName, and comment must be strings';
        }

        firstName = firstName.trim();
        lastName = lastName.trim();
        comment = comment.trim();

        if (firstName.length === 0 || lastName.length === 0 || comment.length === 0)
        {
            throw 'firstName, lastName, and comment cannot be empty strings';
        }

        commentObject._id = new ObjectId();
        commentObject.name = firstName + " " + lastName;
        commentObject.postTime = moment().format('MM/DD/YYYY hh:mma');
        commentObject.comment = comment;

        return commentObject
    }
};

export default exportedMethods;
