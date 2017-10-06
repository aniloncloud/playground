
var AWS = require('aws-sdk');
// Load credentials and set region from JSON file

var params = {

};
var ec2 = new AWS.EC2({
    apiVersion: '2016-11-15'
});


var isInstanceRestartNeededList = [];



exports.handler = (event, context) => {
    isInstanceRestartNeededList = [];
    console.log("Invoking ",JSON.stringify(event.job), " Job");
var stopstart ="";
if(event.job=='start') stopstart="stopped";
else if(event.job=='stop') stopstart="running";

    var describeInstancesparams = {
        Filters: [{
                Name: 'instance-state-name',
                Values: [
                    stopstart
                ]
            }
        ]
    };

    //   console.log("describeInstancesparams",JSON.stringify(describeInstancesparams));

    ec2.describeInstances(describeInstancesparams, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
        //   console.log(data);           // successful response
        for (var item in data.Reservations) {
            var instances = data.Reservations[item].Instances;
            for (var instance in instances) {
                var isInstanceRestartNeeded = false;
                //      console.log( instances[instance].Tags,instances[instance].Tags.length);
                //if(instances[instance].Tags.length==0)  terminationInstanceIds.push(instances[instance].InstanceId);
                for (var itemTag in instances[instance].Tags) {
                    if (instances[instance].Tags[itemTag].Key === 'daily_restart') {

                      if(instances[instance].Tags[itemTag].Value=='true'){
                        isInstanceRestartNeededList.push(instances[instance].InstanceId);
                        break;
                        }
                    }
                }
                }
        }
        console.log(isInstanceRestartNeededList.toString(), isInstanceRestartNeededList.length, " Instances scheduled");

        if (isInstanceRestartNeededList.length > 0) {
            
              var stopstartInstanceparams = {
        InstanceIds: isInstanceRestartNeededList,
      };
                  console.log(stopstartInstanceparams);

          if(event.job=='start') {
            ec2.startInstances(stopstartInstanceparams, function(err, data) {
                if (err) {console.log("error");console.log(err, err.stack);} // an error occurred
                else {
                    console.log("daily ec2 start job completed - ",isInstanceRestartNeededList.toString());
                }
            });
          }
          else if(event.job=='stop')
          {
            ec2.stopInstances(stopstartInstanceparams, function(err, data) {
                if (err) {console.log("error");console.log(err, err.stack);} // an error occurred
                else {
                    console.log("daily ec2 stop job completed - ",isInstanceRestartNeededList.toString());
                }
            });
          }
          else console.log("Event job not passed as expected");

        }
    }
});
};
