export const handler = (event, context) => {
    console.log("ROOT HANDLER EXECUTED!");
    return {
        status: 'ROOT_SUCCESS',
        message: 'Root handler works!',
        timestamp: new Date().toISOString()
    };
};
