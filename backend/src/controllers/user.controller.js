import User from "../models/user.models.js";
import FriendRequest from "../models/friendRequest.models.js";

export const getRecommendedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user
        { $id: { $nin: currentUser.friends } }, //exclude current user's friends
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.log("error in getting recommended users", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMyFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic nativeLanguage learningLanguage"
      );
    res.status(200).json(user.friends);
  } catch (error) {
    console.log("error in fetching friends", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    //can't send request to ourselves
    if (myId === recipientId) {
      res.status(400).json({ message: "you cant send request to youself" });
    }
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(400).json({ message: "cant find recipient" });
    }

    //check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res
        .status(400)
        .json({ message: "can't send request as you are already friends" });
    }

    //check if request already send
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "a friend request already exists between the users" });
    }
    const friendRequest = await FriendRequest.create({
      senderId: myId,
      recipientId: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.log("error in sending friend request", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      res.status(400).json({ message: "friend request not found" });
    }

    //verify if the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      res.status(403).json({ message: "you cant accept request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    //update each user to the other's friends array
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "friend request accepted" });
  } catch (error) {
    console.log("error in accepting friend request", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const incomingRequest = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic nativeLanguage learningLanguage"
    );

    const acceptedRequest = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recepient", "fullName profilePic");

    res.status(200).json({ incomingRequest, acceptedRequest });
  } catch (error) {
    console.log("error in fetching friend request", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getOutgoingFriendRequests = async (req, res) => {
  try {
    const outgoingRequest = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate(
      "recepient",
      "fullName profilePic nativeLanguage learningLanguage"
    );
    res.status(200).json(outgoingRequest);
  } catch (error) {
    console.log("error in get outgoing request controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
