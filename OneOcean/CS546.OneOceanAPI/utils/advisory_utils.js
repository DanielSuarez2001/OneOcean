import moment from 'moment';

let exportedMethods = {
    validateAdvisoryType(advisoryType) {
        let advisoryTypes = ['Close', 'Posting','Rain']

        if (!advisoryType || typeof advisoryType !== 'string')
        {
            throw 'advisoryType parameter must be provided and must be a string';
        }
        let advisoryTypeSanatized = advisoryType.trim();
        if (advisoryTypeSanatized.length === 0)
        {
            throw 'advisoryType cannot be empty';
        }
        advisoryTypeSanatized = advisoryTypeSanatized.charAt(0).toUpperCase() + advisoryTypeSanatized.slice(1);
        if (!advisoryTypes.includes(advisoryTypeSanatized))
        {
            throw `advisoryType must be one of the predefined types: ${advisoryTypes}`;
        }
        return advisoryTypeSanatized;
    },
    validateAdvisoryCause (advisoryCause) {
        if (advisoryCause === undefined || (typeof advisoryCause !== 'string' && advisoryCause !== null))
        {
            throw 'advisoryCause parameter must be provided and must be a string or null';
        }
        if (advisoryCause !== null)
        {
            let advisoryCauseSanatized = advisoryCause.trim();
            if (advisoryCauseSanatized.length < 5 || advisoryCauseSanatized.length > 80)
            {
                throw 'advisoryCause parameter must be a string between 5-80 characters long';
            }
            if (!/^[A-Za-z- ]+$/.test(advisoryCauseSanatized))
            {
                throw 'advisoryCause parameter can only contain letters, hypens, commas, apostrophes, and spaces';
            }
            return advisoryCauseSanatized;
        }
        else
        {
            return advisoryCause
        }
    },
    validateAdvisoryDuration(advisoryDuration) {
        let advisoryDurationSanatized;
        if (!advisoryDuration)
        {
            return null;
        }
        if (typeof advisoryDuration !== 'number')
        {
            if (typeof advisoryDuration === 'string')
            {
                advisoryDurationSanatized = +(advisoryDuration.trim());
                if (Number.isNaN(advisoryDurationSanatized) || !Number.isInteger(advisoryDurationSanatized))
                {
                    throw 'if advisoryDuration is a string it must be in integer form';
                }
            }
            else
            {
                throw 'advisoryDuration must be a number or string in integer form';
            }
        }
        else 
        {
            if (!Number.isInteger(advisoryDuration))
            {
                throw 'advisoryDuration must be an integer';
            }
            advisoryDurationSanatized = advisoryDuration;
        }
        if (advisoryDurationSanatized <= 0)
        {
            throw 'advisoryDuration must be a integer greater than 0';
        }
        return advisoryDurationSanatized;
    },
    validateAdvisoryStartDate(advisoryStartDate) {
        if (!advisoryStartDate || typeof advisoryStartDate !== 'string')
        {
            throw 'advisoryStartDate parameter must be provided and a string';
        }
        let advisoryStartDateSanatized = advisoryStartDate.trim();
        if (advisoryStartDateSanatized.length === 0)
        {
            throw 'advisoryStartDate cannot be an empty string';
        }
        if(!moment(new Date(advisoryStartDateSanatized), "YYYY-MM-DD").isValid())
        {
            throw 'advisoryStartDate is not a valid date';
        }
        advisoryStartDateSanatized = moment(new Date(advisoryStartDateSanatized)).format("YYYY-MM-DD")
        return advisoryStartDateSanatized;
    },
    validateAdvisoryStartTime(advisoryStartTime) {
        if (!advisoryStartTime || typeof advisoryStartTime !== 'string')
        {
            throw 'advisoryStartTime parameter must be provided and a string';
        }
        let advisoryStartTimeSanatized = advisoryStartTime.trim();
        if (advisoryStartTimeSanatized.length < 8)
        {
            throw 'advisoryStartTime cannot be an empty string and must be in HH:MM:SS format';
        }
        if (!/(?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)/.test(advisoryStartTimeSanatized))
        {
            throw 'advisoryStartTime is not a valid time and must be in HH:MM:SS format';
        }
        return advisoryStartTimeSanatized;
    },
    validateAdvisoryEndDate(advisoryEndDate) {
        if (!advisoryEndDate)
        {
            return null;
        }
        if (typeof advisoryEndDate !== 'string')
        {
            throw 'advisoryEndDate must be a string';
        }
        let advisoryEndDateSanatized = advisoryEndDate.trim();
        if (advisoryEndDateSanatized.length === 0)
        {
            throw 'advisoryEndDate cannot be an empty string and must be in MM/DD/YYYY format';
        }
        if(!moment(new Date(advisoryEndDateSanatized), "MM/DD/YYYY").isValid())
        {
            throw 'advisoryEndDate is not a valid date';
        }
        advisoryEndDateSanatized = moment(new Date(advisoryEndDateSanatized)).format("YYYY-MM-DD")
        return advisoryEndDateSanatized;
    },
    validateAdvisoryEndTime(advisoryEndTime) {
        if (!advisoryEndTime)
        {
            return null;
        }
        if (typeof advisoryEndTime !== 'string')
        {
            throw 'advisoryEndTime must be a string';
        }
        let advisoryEndTimeSanatized = advisoryEndTime.trim();
        if (advisoryEndTimeSanatized.length < 8)
        {
            throw 'advisoryEndTime cannot be an empty string and must be in HH:MM:SS format';
        }
        if (!/(?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)/.test(advisoryEndTimeSanatized))
        {
            throw 'advisoryEndTime is not a valid time and must be in HH:MM:SS format';
        }
        return advisoryEndTimeSanatized;
    },
    isActiveAdvisory(advisoryObject)
    {
        if (!advisoryObject || typeof advisoryObject !== 'object')
        {
            throw 'advisoryObject parameter must be provided and a string'
        }
        let currentTime = new Date()
        let advisoryEndDate = advisoryObject.advisoryEndDate;
        let advisoryEndTime = advisoryObject.advisoryEndTime;
        let advisoryDuration = advisoryObject.advisoryDuration;
        let advisoryEndDatetime = null;

        if (advisoryEndDate)
        {   
            advisoryEndDate = moment(new Date(advisoryEndDate)).format("YYYY-MM-DD");
            if (advisoryEndTime)
            {
                advisoryEndDatetime = advisoryEndDate + 'T' + advisoryEndTime;
            }
            else
            {
                advisoryEndDatetime = advisoryEndDate + 'T00:00:00';
            }
            if (new Date(advisoryEndDatetime) > currentTime)
            {
                return true;
            }
            return false;
        }
        else if (advisoryDuration)
        {
            let advisoryStartDateTime = new Date(moment(new Date(advisoryObject.advisoryStartDate)).format("YYYY-MM-DD") + 'T' + advisoryObject.advisoryStartTime);
            advisoryEndDatetime = moment(advisoryStartDateTime).add(advisoryDuration, 'days');
            if (new Date(advisoryEndDatetime) > currentTime)
            {
                return true;
            }
            return false;
        }
        return true;
    }
};

export default exportedMethods;
