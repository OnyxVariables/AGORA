package com.agora.votations.contract;

import io.reactivex.Flowable;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Bytes32;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.abi.datatypes.generated.Uint8;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameter;
import org.web3j.protocol.core.RemoteCall;
import org.web3j.protocol.core.RemoteFunctionCall;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.protocol.core.methods.response.BaseEventResponse;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.Contract;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;

/**
 * <p>Auto generated code.
 * <p><strong>Do not modify!</strong>
 * <p>Please use the <a href="https://docs.web3j.io/command_line.html">web3j command line tools</a>,
 * or the org.web3j.codegen.SolidityFunctionWrapperGenerator in the 
 * <a href="https://github.com/web3j/web3j/tree/master/codegen">codegen module</a> to update.
 *
 * <p>Generated with web3j version 4.10.3.
 */
@SuppressWarnings("rawtypes")
public class SimpleVoting extends Contract {
    public static final String BINARY = "6080604052348015600e575f5ffd5b50600280546001600160a01b03191633179055610ea68061002e5f395ff3fe608060405234801561000f575f5ffd5b506004361061007a575f3560e01c806375829def1161005857806375829def146100cc578063a16974cc146100df578063a6121520146100f2578063f851a44014610105575f5ffd5b8063073b9dfa1461007e5780634770fa6c146100935780634f33ffa0146100a6575b5f5ffd5b61009161008c3660046109c1565b610130565b005b6100916100a1366004610a57565b61027b565b6100b96100b4366004610a9b565b61038a565b6040519081526020015b60405180910390f35b6100916100da366004610aca565b6105a7565b6100916100ed366004610af7565b61063e565b610091610100366004610b0e565b61078a565b600254610118906001600160a01b031681565b6040516001600160a01b0390911681526020016100c3565b6002546001600160a01b031633146101635760405162461bcd60e51b815260040161015a90610b8c565b60405180910390fd5b60015486106101845760405162461bcd60e51b815260040161015a90610bb8565b8183106101c65760405162461bcd60e51b815260206004820152601060248201526f46656368617320696e76616c6964617360801b604482015260640161015a565b5f868152600460205260409020600181016101e18782610c68565b50600281016101f08682610c68565b50600381018490556004810183905560058101805483919060ff1916600183600281111561022057610220610d23565b02179055504260078201819055604051339189917f6a989f9035d5b6c48acf961285a70ced3d3b98c4115a644f7505162918b9f3469161026a918b918b918b918b918b9190610d65565b60405180910390a350505050505050565b6002546001600160a01b031633146102a55760405162461bcd60e51b815260040161015a90610b8c565b60015482106102c65760405162461bcd60e51b815260040161015a90610bb8565b5f8281526004602052604090206001600582015460ff1660028111156102ee576102ee610d23565b036103315760405162461bcd60e51b8152602060048201526013602482015272566f746163696f6e2066696e616c697a61646160681b604482015260640161015a565b60058101805460ff191660021790554260078201819055604051339185917fa66bd47087dbccb1836c162cd8e929671ae1c4ad9ab77b5d1e6c1706aa5d07b09161037d91879190610dc8565b60405180910390a3505050565b6002545f906001600160a01b031633146103b65760405162461bcd60e51b815260040161015a90610b8c565b5f8281526003602052604090205460ff16156104055760405162461bcd60e51b815260206004820152600e60248201526d566f746f206475706c696361646f60901b604482015260640161015a565b60015484106104265760405162461bcd60e51b815260040161015a90610bb8565b5f84815260046020526040812090600582015460ff16600281111561044d5761044d610d23565b1461048f5760405162461bcd60e51b8152602060048201526012602482015271566f746163696f6e206e6f2061637469766160701b604482015260640161015a565b80600301544210156104da5760405162461bcd60e51b8152602060048201526014602482015273566f746163696f6e206e6f20696e69636961646160601b604482015260640161015a565b80600401544211156105245760405162461bcd60e51b8152602060048201526013602482015272566f746163696f6e2066696e616c697a61646160681b604482015260640161015a565b5f8054818061053283610dfd565b909155505f85815260036020908152604091829020805460ff1916600117905581518a8152908101889052908101869052426060820152909150869082907f70f253d73861fcd646d3301281cec28da25e98292501bcea71720b865e44dea89060800160405180910390a39695505050505050565b6002546001600160a01b031633146105d15760405162461bcd60e51b815260040161015a90610b8c565b6001600160a01b03811661061c5760405162461bcd60e51b8152602060048201526012602482015271446972656363696f6e20696e76616c69646160701b604482015260640161015a565b600280546001600160a01b0319166001600160a01b0392909216919091179055565b6002546001600160a01b031633146106685760405162461bcd60e51b815260040161015a90610b8c565b60015481106106895760405162461bcd60e51b815260040161015a90610bb8565b5f81815260046020526040812090600582015460ff1660028111156106b0576106b0610d23565b146106ee5760405162461bcd60e51b815260206004820152600e60248201526d4e6f20657374612061637469766160901b604482015260640161015a565b80600401544210156107385760405162461bcd60e51b815260206004820152601360248201527241756e206e6f206861207465726d696e61646f60681b604482015260640161015a565b60058101805460ff191660011790554260078201819055604051908152339083907fc2f00489487cb01d4d7870691f9a4821270fcaf783ca054754be96ee204102259060200160405180910390a35050565b6002546001600160a01b031633146107b45760405162461bcd60e51b815260040161015a90610b8c565b8082106107f65760405162461bcd60e51b815260206004820152601060248201526f46656368617320696e76616c6964617360801b604482015260640161015a565b5f8581526004602052604090206005015461010090046001600160a01b0316156108595760405162461bcd60e51b8152602060048201526014602482015273566f746174696f6e49642079612065786973746560601b604482015260640161015a565b60015485106108715761086d856001610e15565b6001555b5f8581526004602052604090208581556001810161088f8682610c68565b506002810161089e8582610c68565b5060038101839055600481018290556005810180546001600160a81b0319163361010081029190911790915542600683018190556007830181905560405188917f3f4f2db19f1c69694bb81bb8a44b76ecdde7b9ff30983f11cc9334b37daa2d5691610912918a918a918a918a9190610e2e565b60405180910390a3505050505050565b634e487b7160e01b5f52604160045260245ffd5b5f82601f830112610945575f5ffd5b813567ffffffffffffffff81111561095f5761095f610922565b604051601f8201601f19908116603f0116810167ffffffffffffffff8111828210171561098e5761098e610922565b6040528181528382016020018510156109a5575f5ffd5b816020850160208301375f918101602001919091529392505050565b5f5f5f5f5f5f60c087890312156109d6575f5ffd5b86359550602087013567ffffffffffffffff8111156109f3575f5ffd5b6109ff89828a01610936565b955050604087013567ffffffffffffffff811115610a1b575f5ffd5b610a2789828a01610936565b945050606087013592506080870135915060a087013560038110610a49575f5ffd5b809150509295509295509295565b5f5f60408385031215610a68575f5ffd5b82359150602083013567ffffffffffffffff811115610a85575f5ffd5b610a9185828601610936565b9150509250929050565b5f5f5f5f60808587031215610aae575f5ffd5b5050823594602084013594506040840135936060013592509050565b5f60208284031215610ada575f5ffd5b81356001600160a01b0381168114610af0575f5ffd5b9392505050565b5f60208284031215610b07575f5ffd5b5035919050565b5f5f5f5f5f60a08688031215610b22575f5ffd5b85359450602086013567ffffffffffffffff811115610b3f575f5ffd5b610b4b88828901610936565b945050604086013567ffffffffffffffff811115610b67575f5ffd5b610b7388828901610936565b9598949750949560608101359550608001359392505050565b60208082526012908201527129b7b6379030b236b4b734b9ba3930b237b960711b604082015260600190565b602080825260129082015271566f746163696f6e206e6f2065786973746560701b604082015260600190565b600181811c90821680610bf857607f821691505b602082108103610c1657634e487b7160e01b5f52602260045260245ffd5b50919050565b601f821115610c6357805f5260205f20601f840160051c81016020851015610c415750805b601f840160051c820191505b81811015610c60575f8155600101610c4d565b50505b505050565b815167ffffffffffffffff811115610c8257610c82610922565b610c9681610c908454610be4565b84610c1c565b6020601f821160018114610cc8575f8315610cb15750848201515b5f19600385901b1c1916600184901b178455610c60565b5f84815260208120601f198516915b82811015610cf75787850151825560209485019460019092019101610cd7565b5084821015610d1457868401515f19600387901b60f8161c191681555b50505050600190811b01905550565b634e487b7160e01b5f52602160045260245ffd5b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b60c081525f610d7760c0830189610d37565b8281036020840152610d898189610d37565b91505085604083015284606083015260038410610db457634e487b7160e01b5f52602160045260245ffd5b608082019390935260a00152949350505050565b604081525f610dda6040830185610d37565b90508260208301529392505050565b634e487b7160e01b5f52601160045260245ffd5b5f60018201610e0e57610e0e610de9565b5060010190565b80820180821115610e2857610e28610de9565b92915050565b60a081525f610e4060a0830188610d37565b8281036020840152610e528188610d37565b6040840196909652505060608101929092526080909101529291505056fea264697066735822122073385263f80b85e0c952c892c33315c67427e9f55def418ce1d3296cd6de599664736f6c634300081e0033";

    public static final String FUNC_ADMIN = "admin";

    public static final String FUNC_CANCELVOTATION = "cancelVotation";

    public static final String FUNC_CREATEVOTATION = "createVotation";

    public static final String FUNC_FINISHVOTATION = "finishVotation";

    public static final String FUNC_SUBMITVOTE = "submitVote";

    public static final String FUNC_TRANSFERADMIN = "transferAdmin";

    public static final String FUNC_UPDATEVOTATION = "updateVotation";

    public static final Event VOTATIONCANCELLED_EVENT = new Event("VotationCancelled", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>(true) {}, new TypeReference<Utf8String>() {}, new TypeReference<Address>(true) {}, new TypeReference<Uint256>() {}));
    ;

    public static final Event VOTATIONCREATED_EVENT = new Event("VotationCreated", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>(true) {}, new TypeReference<Utf8String>() {}, new TypeReference<Utf8String>() {}, new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}, new TypeReference<Address>(true) {}, new TypeReference<Uint256>() {}));
    ;

    public static final Event VOTATIONFINISHED_EVENT = new Event("VotationFinished", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>(true) {}, new TypeReference<Address>(true) {}, new TypeReference<Uint256>() {}));
    ;

    public static final Event VOTATIONUPDATED_EVENT = new Event("VotationUpdated", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>(true) {}, new TypeReference<Utf8String>() {}, new TypeReference<Utf8String>() {}, new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}, new TypeReference<Uint8>() {}, new TypeReference<Address>(true) {}, new TypeReference<Uint256>() {}));
    ;

    public static final Event VOTESUBMITTED_EVENT = new Event("VoteSubmitted", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>(true) {}, new TypeReference<Uint256>(true) {}, new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}, new TypeReference<Bytes32>() {}, new TypeReference<Uint256>() {}));
    ;

    @Deprecated
    protected SimpleVoting(String contractAddress, Web3j web3j, Credentials credentials, BigInteger gasPrice, BigInteger gasLimit) {
        super(BINARY, contractAddress, web3j, credentials, gasPrice, gasLimit);
    }

    protected SimpleVoting(String contractAddress, Web3j web3j, Credentials credentials, ContractGasProvider contractGasProvider) {
        super(BINARY, contractAddress, web3j, credentials, contractGasProvider);
    }

    @Deprecated
    protected SimpleVoting(String contractAddress, Web3j web3j, TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        super(BINARY, contractAddress, web3j, transactionManager, gasPrice, gasLimit);
    }

    protected SimpleVoting(String contractAddress, Web3j web3j, TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        super(BINARY, contractAddress, web3j, transactionManager, contractGasProvider);
    }

    public static List<VotationCancelledEventResponse> getVotationCancelledEvents(TransactionReceipt transactionReceipt) {
        List<Contract.EventValuesWithLog> valueList = staticExtractEventParametersWithLog(VOTATIONCANCELLED_EVENT, transactionReceipt);
        ArrayList<VotationCancelledEventResponse> responses = new ArrayList<VotationCancelledEventResponse>(valueList.size());
        for (Contract.EventValuesWithLog eventValues : valueList) {
            VotationCancelledEventResponse typedResponse = new VotationCancelledEventResponse();
            typedResponse.log = eventValues.getLog();
            typedResponse.votationId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
            typedResponse.canceller = (String) eventValues.getIndexedValues().get(1).getValue();
            typedResponse.reason = (String) eventValues.getNonIndexedValues().get(0).getValue();
            typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(1).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static VotationCancelledEventResponse getVotationCancelledEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(VOTATIONCANCELLED_EVENT, log);
        VotationCancelledEventResponse typedResponse = new VotationCancelledEventResponse();
        typedResponse.log = log;
        typedResponse.votationId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
        typedResponse.canceller = (String) eventValues.getIndexedValues().get(1).getValue();
        typedResponse.reason = (String) eventValues.getNonIndexedValues().get(0).getValue();
        typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(1).getValue();
        return typedResponse;
    }

    public Flowable<VotationCancelledEventResponse> votationCancelledEventFlowable(EthFilter filter) {
        return web3j.ethLogFlowable(filter).map(log -> getVotationCancelledEventFromLog(log));
    }

    public Flowable<VotationCancelledEventResponse> votationCancelledEventFlowable(DefaultBlockParameter startBlock, DefaultBlockParameter endBlock) {
        EthFilter filter = new EthFilter(startBlock, endBlock, getContractAddress());
        filter.addSingleTopic(EventEncoder.encode(VOTATIONCANCELLED_EVENT));
        return votationCancelledEventFlowable(filter);
    }

    public static List<VotationCreatedEventResponse> getVotationCreatedEvents(TransactionReceipt transactionReceipt) {
        List<Contract.EventValuesWithLog> valueList = staticExtractEventParametersWithLog(VOTATIONCREATED_EVENT, transactionReceipt);
        ArrayList<VotationCreatedEventResponse> responses = new ArrayList<VotationCreatedEventResponse>(valueList.size());
        for (Contract.EventValuesWithLog eventValues : valueList) {
            VotationCreatedEventResponse typedResponse = new VotationCreatedEventResponse();
            typedResponse.log = eventValues.getLog();
            typedResponse.votationId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
            typedResponse.creator = (String) eventValues.getIndexedValues().get(1).getValue();
            typedResponse.title = (String) eventValues.getNonIndexedValues().get(0).getValue();
            typedResponse.description = (String) eventValues.getNonIndexedValues().get(1).getValue();
            typedResponse.startDate = (BigInteger) eventValues.getNonIndexedValues().get(2).getValue();
            typedResponse.endDate = (BigInteger) eventValues.getNonIndexedValues().get(3).getValue();
            typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(4).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static VotationCreatedEventResponse getVotationCreatedEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(VOTATIONCREATED_EVENT, log);
        VotationCreatedEventResponse typedResponse = new VotationCreatedEventResponse();
        typedResponse.log = log;
        typedResponse.votationId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
        typedResponse.creator = (String) eventValues.getIndexedValues().get(1).getValue();
        typedResponse.title = (String) eventValues.getNonIndexedValues().get(0).getValue();
        typedResponse.description = (String) eventValues.getNonIndexedValues().get(1).getValue();
        typedResponse.startDate = (BigInteger) eventValues.getNonIndexedValues().get(2).getValue();
        typedResponse.endDate = (BigInteger) eventValues.getNonIndexedValues().get(3).getValue();
        typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(4).getValue();
        return typedResponse;
    }

    public Flowable<VotationCreatedEventResponse> votationCreatedEventFlowable(EthFilter filter) {
        return web3j.ethLogFlowable(filter).map(log -> getVotationCreatedEventFromLog(log));
    }

    public Flowable<VotationCreatedEventResponse> votationCreatedEventFlowable(DefaultBlockParameter startBlock, DefaultBlockParameter endBlock) {
        EthFilter filter = new EthFilter(startBlock, endBlock, getContractAddress());
        filter.addSingleTopic(EventEncoder.encode(VOTATIONCREATED_EVENT));
        return votationCreatedEventFlowable(filter);
    }

    public static List<VotationFinishedEventResponse> getVotationFinishedEvents(TransactionReceipt transactionReceipt) {
        List<Contract.EventValuesWithLog> valueList = staticExtractEventParametersWithLog(VOTATIONFINISHED_EVENT, transactionReceipt);
        ArrayList<VotationFinishedEventResponse> responses = new ArrayList<VotationFinishedEventResponse>(valueList.size());
        for (Contract.EventValuesWithLog eventValues : valueList) {
            VotationFinishedEventResponse typedResponse = new VotationFinishedEventResponse();
            typedResponse.log = eventValues.getLog();
            typedResponse.votationId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
            typedResponse.finisher = (String) eventValues.getIndexedValues().get(1).getValue();
            typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static VotationFinishedEventResponse getVotationFinishedEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(VOTATIONFINISHED_EVENT, log);
        VotationFinishedEventResponse typedResponse = new VotationFinishedEventResponse();
        typedResponse.log = log;
        typedResponse.votationId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
        typedResponse.finisher = (String) eventValues.getIndexedValues().get(1).getValue();
        typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
        return typedResponse;
    }

    public Flowable<VotationFinishedEventResponse> votationFinishedEventFlowable(EthFilter filter) {
        return web3j.ethLogFlowable(filter).map(log -> getVotationFinishedEventFromLog(log));
    }

    public Flowable<VotationFinishedEventResponse> votationFinishedEventFlowable(DefaultBlockParameter startBlock, DefaultBlockParameter endBlock) {
        EthFilter filter = new EthFilter(startBlock, endBlock, getContractAddress());
        filter.addSingleTopic(EventEncoder.encode(VOTATIONFINISHED_EVENT));
        return votationFinishedEventFlowable(filter);
    }

    public static List<VotationUpdatedEventResponse> getVotationUpdatedEvents(TransactionReceipt transactionReceipt) {
        List<Contract.EventValuesWithLog> valueList = staticExtractEventParametersWithLog(VOTATIONUPDATED_EVENT, transactionReceipt);
        ArrayList<VotationUpdatedEventResponse> responses = new ArrayList<VotationUpdatedEventResponse>(valueList.size());
        for (Contract.EventValuesWithLog eventValues : valueList) {
            VotationUpdatedEventResponse typedResponse = new VotationUpdatedEventResponse();
            typedResponse.log = eventValues.getLog();
            typedResponse.votationId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
            typedResponse.updater = (String) eventValues.getIndexedValues().get(1).getValue();
            typedResponse.title = (String) eventValues.getNonIndexedValues().get(0).getValue();
            typedResponse.description = (String) eventValues.getNonIndexedValues().get(1).getValue();
            typedResponse.startDate = (BigInteger) eventValues.getNonIndexedValues().get(2).getValue();
            typedResponse.endDate = (BigInteger) eventValues.getNonIndexedValues().get(3).getValue();
            typedResponse.state = (BigInteger) eventValues.getNonIndexedValues().get(4).getValue();
            typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(5).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static VotationUpdatedEventResponse getVotationUpdatedEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(VOTATIONUPDATED_EVENT, log);
        VotationUpdatedEventResponse typedResponse = new VotationUpdatedEventResponse();
        typedResponse.log = log;
        typedResponse.votationId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
        typedResponse.updater = (String) eventValues.getIndexedValues().get(1).getValue();
        typedResponse.title = (String) eventValues.getNonIndexedValues().get(0).getValue();
        typedResponse.description = (String) eventValues.getNonIndexedValues().get(1).getValue();
        typedResponse.startDate = (BigInteger) eventValues.getNonIndexedValues().get(2).getValue();
        typedResponse.endDate = (BigInteger) eventValues.getNonIndexedValues().get(3).getValue();
        typedResponse.state = (BigInteger) eventValues.getNonIndexedValues().get(4).getValue();
        typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(5).getValue();
        return typedResponse;
    }

    public Flowable<VotationUpdatedEventResponse> votationUpdatedEventFlowable(EthFilter filter) {
        return web3j.ethLogFlowable(filter).map(log -> getVotationUpdatedEventFromLog(log));
    }

    public Flowable<VotationUpdatedEventResponse> votationUpdatedEventFlowable(DefaultBlockParameter startBlock, DefaultBlockParameter endBlock) {
        EthFilter filter = new EthFilter(startBlock, endBlock, getContractAddress());
        filter.addSingleTopic(EventEncoder.encode(VOTATIONUPDATED_EVENT));
        return votationUpdatedEventFlowable(filter);
    }

    public static List<VoteSubmittedEventResponse> getVoteSubmittedEvents(TransactionReceipt transactionReceipt) {
        List<Contract.EventValuesWithLog> valueList = staticExtractEventParametersWithLog(VOTESUBMITTED_EVENT, transactionReceipt);
        ArrayList<VoteSubmittedEventResponse> responses = new ArrayList<VoteSubmittedEventResponse>(valueList.size());
        for (Contract.EventValuesWithLog eventValues : valueList) {
            VoteSubmittedEventResponse typedResponse = new VoteSubmittedEventResponse();
            typedResponse.log = eventValues.getLog();
            typedResponse.voteId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
            typedResponse.votationId = (BigInteger) eventValues.getIndexedValues().get(1).getValue();
            typedResponse.partyId = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
            typedResponse.municipalityId = (BigInteger) eventValues.getNonIndexedValues().get(1).getValue();
            typedResponse.voteHash = (byte[]) eventValues.getNonIndexedValues().get(2).getValue();
            typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(3).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static VoteSubmittedEventResponse getVoteSubmittedEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(VOTESUBMITTED_EVENT, log);
        VoteSubmittedEventResponse typedResponse = new VoteSubmittedEventResponse();
        typedResponse.log = log;
        typedResponse.voteId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
        typedResponse.votationId = (BigInteger) eventValues.getIndexedValues().get(1).getValue();
        typedResponse.partyId = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
        typedResponse.municipalityId = (BigInteger) eventValues.getNonIndexedValues().get(1).getValue();
        typedResponse.voteHash = (byte[]) eventValues.getNonIndexedValues().get(2).getValue();
        typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(3).getValue();
        return typedResponse;
    }

    public Flowable<VoteSubmittedEventResponse> voteSubmittedEventFlowable(EthFilter filter) {
        return web3j.ethLogFlowable(filter).map(log -> getVoteSubmittedEventFromLog(log));
    }

    public Flowable<VoteSubmittedEventResponse> voteSubmittedEventFlowable(DefaultBlockParameter startBlock, DefaultBlockParameter endBlock) {
        EthFilter filter = new EthFilter(startBlock, endBlock, getContractAddress());
        filter.addSingleTopic(EventEncoder.encode(VOTESUBMITTED_EVENT));
        return voteSubmittedEventFlowable(filter);
    }

    public RemoteFunctionCall<String> admin() {
        final Function function = new Function(FUNC_ADMIN, 
                Arrays.<Type>asList(), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Address>() {}));
        return executeRemoteCallSingleValueReturn(function, String.class);
    }

    public RemoteFunctionCall<TransactionReceipt> cancelVotation(BigInteger _votationId, String _reason) {
        final Function function = new Function(
                FUNC_CANCELVOTATION, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_votationId), 
                new org.web3j.abi.datatypes.Utf8String(_reason)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<TransactionReceipt> createVotation(BigInteger _votationId, String _title, String _description, BigInteger _startDate, BigInteger _endDate) {
        final Function function = new Function(
                FUNC_CREATEVOTATION, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_votationId), 
                new org.web3j.abi.datatypes.Utf8String(_title), 
                new org.web3j.abi.datatypes.Utf8String(_description), 
                new org.web3j.abi.datatypes.generated.Uint256(_startDate), 
                new org.web3j.abi.datatypes.generated.Uint256(_endDate)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<TransactionReceipt> finishVotation(BigInteger _votationId) {
        final Function function = new Function(
                FUNC_FINISHVOTATION, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_votationId)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<TransactionReceipt> submitVote(BigInteger _partyId, BigInteger _votationId, BigInteger _municipalityId, byte[] _voteHash) {
        final Function function = new Function(
                FUNC_SUBMITVOTE, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_partyId), 
                new org.web3j.abi.datatypes.generated.Uint256(_votationId), 
                new org.web3j.abi.datatypes.generated.Uint256(_municipalityId), 
                new org.web3j.abi.datatypes.generated.Bytes32(_voteHash)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<TransactionReceipt> transferAdmin(String _newAdmin) {
        final Function function = new Function(
                FUNC_TRANSFERADMIN, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.Address(160, _newAdmin)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<TransactionReceipt> updateVotation(BigInteger _votationId, String _title, String _description, BigInteger _startDate, BigInteger _endDate, BigInteger _state) {
        final Function function = new Function(
                FUNC_UPDATEVOTATION, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_votationId), 
                new org.web3j.abi.datatypes.Utf8String(_title), 
                new org.web3j.abi.datatypes.Utf8String(_description), 
                new org.web3j.abi.datatypes.generated.Uint256(_startDate), 
                new org.web3j.abi.datatypes.generated.Uint256(_endDate), 
                new org.web3j.abi.datatypes.generated.Uint8(_state)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    @Deprecated
    public static SimpleVoting load(String contractAddress, Web3j web3j, Credentials credentials, BigInteger gasPrice, BigInteger gasLimit) {
        return new SimpleVoting(contractAddress, web3j, credentials, gasPrice, gasLimit);
    }

    @Deprecated
    public static SimpleVoting load(String contractAddress, Web3j web3j, TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        return new SimpleVoting(contractAddress, web3j, transactionManager, gasPrice, gasLimit);
    }

    public static SimpleVoting load(String contractAddress, Web3j web3j, Credentials credentials, ContractGasProvider contractGasProvider) {
        return new SimpleVoting(contractAddress, web3j, credentials, contractGasProvider);
    }

    public static SimpleVoting load(String contractAddress, Web3j web3j, TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        return new SimpleVoting(contractAddress, web3j, transactionManager, contractGasProvider);
    }

    public static RemoteCall<SimpleVoting> deploy(Web3j web3j, Credentials credentials, ContractGasProvider contractGasProvider) {
        return deployRemoteCall(SimpleVoting.class, web3j, credentials, contractGasProvider, BINARY, "");
    }

    public static RemoteCall<SimpleVoting> deploy(Web3j web3j, TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        return deployRemoteCall(SimpleVoting.class, web3j, transactionManager, contractGasProvider, BINARY, "");
    }

    @Deprecated
    public static RemoteCall<SimpleVoting> deploy(Web3j web3j, Credentials credentials, BigInteger gasPrice, BigInteger gasLimit) {
        return deployRemoteCall(SimpleVoting.class, web3j, credentials, gasPrice, gasLimit, BINARY, "");
    }

    @Deprecated
    public static RemoteCall<SimpleVoting> deploy(Web3j web3j, TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        return deployRemoteCall(SimpleVoting.class, web3j, transactionManager, gasPrice, gasLimit, BINARY, "");
    }

    public static class VotationCancelledEventResponse extends BaseEventResponse {
        public BigInteger votationId;

        public String canceller;

        public String reason;

        public BigInteger timestamp;
    }

    public static class VotationCreatedEventResponse extends BaseEventResponse {
        public BigInteger votationId;

        public String creator;

        public String title;

        public String description;

        public BigInteger startDate;

        public BigInteger endDate;

        public BigInteger timestamp;
    }

    public static class VotationFinishedEventResponse extends BaseEventResponse {
        public BigInteger votationId;

        public String finisher;

        public BigInteger timestamp;
    }

    public static class VotationUpdatedEventResponse extends BaseEventResponse {
        public BigInteger votationId;

        public String updater;

        public String title;

        public String description;

        public BigInteger startDate;

        public BigInteger endDate;

        public BigInteger state;

        public BigInteger timestamp;
    }

    public static class VoteSubmittedEventResponse extends BaseEventResponse {
        public BigInteger voteId;

        public BigInteger votationId;

        public BigInteger partyId;

        public BigInteger municipalityId;

        public byte[] voteHash;

        public BigInteger timestamp;
    }
}
