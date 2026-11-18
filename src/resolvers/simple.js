export const handler = async (event, context) => {
    console.log("SIMPLE RESOLVER EXECUTED!");
    console.log("Event:", JSON.stringify(event));

    return {
        status: 'SIMPLE_SUCCESS',
        message: 'The simple resolver works!',
        timestamp: new Date().toISOString()
    };
};
